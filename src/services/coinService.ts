import { supabase } from '../auth/supabase';
import { CoinTransaction } from '../types';

/**
 * Service to handle WeCoins related operations.
 * Uses `profiles` for coins_balance, `daily_checkins` for streaks,
 * and `coin_transactions` table for logs.
 */
export const coinService = {

    /** Fetch current coin balance */
    async getBalance(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('coins_balance')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data?.coins_balance ?? 0;
        } catch (e) {
            console.error('[coinService] getBalance error:', e);
            return 0;
        }
    },

    /** Fetch last_checkin_date timestamp & current_streak */
    async getRewardMeta(userId: string): Promise<{ lastClaim: string | null; streakCount: number }> {
        try {
            const { data, error } = await supabase
                .from('daily_checkins')
                .select('last_checkin_date, current_streak')
                .eq('user_id', userId)
                .maybeSingle();
            if (error && error.code !== 'PGRST116') throw error;
            return {
                lastClaim: data?.last_checkin_date ?? null,
                streakCount: data?.current_streak ?? 0,
            };
        } catch (e) {
            console.error('[coinService] getRewardMeta error:', e);
            return { lastClaim: null, streakCount: 0 };
        }
    },

    /**
     * Check if user is eligible for today's reward.
     * Eligible = no claim ever OR last claim was before midnight today (24h cycle).
     */
    isEligible(lastClaim: string | null): boolean {
        if (!lastClaim) return true;
        const last = new Date(lastClaim);
        const now = new Date();
        // Midnight-based: eligible if last claim was before today's midnight
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        return last < todayMidnight;
    },

    /**
     * How many ms until next midnight (next drop).
     */
    msUntilNextDrop(): number {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        return tomorrow.getTime() - now.getTime();
    },

    /** Human-readable countdown: "14h 22m" */
    formatCountdown(ms: number): string {
        if (ms <= 0) return '0m';
        const totalMins = Math.floor(ms / 60000);
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    },

    /**
     * Claim the daily reward.
     * Calls the Supabase RPC function `handle_daily_checkin`.
     */
    async claimDailyReward(userId: string) {
        try {
            const { data, error } = await supabase.rpc('handle_daily_checkin', {
                p_user_id: userId,
            });

            if (error) throw error;

            // RPC handles balance update, streak upsert, and transaction logging.
            // Return success and optionally the data if it contains the new balance.
            return { success: true, data };
        } catch (e) {
            console.error('[coinService] claimDailyReward error:', e);
            return { success: false, error: e };
        }
    },

    /** Fetch transaction history */
    async getTransactions(userId: string): Promise<CoinTransaction[]> {
        try {
            const { data, error } = await supabase
                .from('coin_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data ?? [];
        } catch (e) {
            console.error('[coinService] getTransactions error:', e);
            return [];
        }
    },

    /**
     * Subscribe to real-time balance updates.
     * Returns an unsubscribe function.
     */
    subscribeToBalanceChanges(userId: string, onUpdate: (balance: number) => void): () => void {
        const channel = supabase
            .channel(`coins-realtime-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    if (payload.new && 'coins_balance' in payload.new) {
                        onUpdate(payload.new.coins_balance as number);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /** Fetch last 7 days grouped by day for Yield Analytics */
    async fetchWeeklyYield(userId: string): Promise<{ day: string; amount: number }[]> {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

            const { data, error } = await supabase
                .from('coin_transactions')
                .select('amount, created_at')
                .eq('user_id', userId)
                .gt('amount', 0) // Only earnings as requested
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Initialize last 7 days array
            const daysMap = new Map<string, number>();
            
            // Populate the map with 0 for the last 7 days to ensure graph continuity
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
                daysMap.set(dayName, 0);
            }

            // Aggregate data
            data?.forEach(tx => {
                const txDate = new Date(tx.created_at);
                const dayName = txDate.toLocaleDateString('en-US', { weekday: 'short' });
                if (daysMap.has(dayName)) {
                    daysMap.set(dayName, daysMap.get(dayName)! + tx.amount);
                }
            });

            // Convert to array
            return Array.from(daysMap, ([day, amount]) => ({ day, amount }));
        } catch (e) {
            console.error('[coinService] fetchWeeklyYield error:', e);
            return [];
        }
    },

    /** Call the website's add_coins RPC if it exists */
    async addCoinsRPC(userId: string, amount: number) {
        try {
            const { data, error } = await supabase.rpc('add_coins', {
                p_user_id: userId,
                p_amount: amount,
            });
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('[coinService] addCoinsRPC error:', e);
            throw e;
        }
    },

    /** Fetch Leaderboard data */
    async getLeaderboard(period: 'all_time' | 'weekly'): Promise<any[]> {
        try {
            if (period === 'all_time') {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, coins_balance, occupation, role')
                    .order('coins_balance', { ascending: false })
                    .limit(50);
                if (error) throw error;
                return data ?? [];
            } else {
                // Weekly: last 7 days aggregation
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const { data, error } = await supabase
                    .from('coin_transactions')
                    .select('user_id, amount, profiles:user_id(id, first_name, last_name, avatar_url, occupation, role)')
                    .gt('amount', 0)
                    .gte('created_at', sevenDaysAgo.toISOString());

                if (error) throw error;

                // Manual aggregation
                const userTotals = new Map<string, any>();
                data?.forEach(tx => {
                    const uid = tx.user_id;
                    const amount = tx.amount || 0;
                    if (!userTotals.has(uid)) {
                        userTotals.set(uid, {
                            ...tx.profiles,
                            coins_balance: 0
                        });
                    }
                    userTotals.get(uid).coins_balance += amount;
                });

                return Array.from(userTotals.values())
                    .sort((a, b) => b.coins_balance - a.coins_balance)
                    .slice(0, 50);
            }
        } catch (e) {
            console.error('[coinService] getLeaderboard error:', e);
            return [];
        }
    }
};
