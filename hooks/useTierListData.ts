import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TierListService } from '@/services/TierListService';
import { ChampionTier } from '@/types';

export function useTierListData() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state with defaults to prevent hydration mismatch
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [selectedRank, setSelectedRank] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const role = searchParams.get('role');
        const rank = searchParams.get('rank');
        if (role) setSelectedRole(role);
        if (rank) setSelectedRank(rank);
    }, [searchParams]);

    const [data, setData] = useState<ChampionTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ChampionTier; direction: 'asc' | 'desc' } | null>({ key: 'tier', direction: 'desc' });

    // Update URL when filters change
    useEffect(() => {
        if (!isMounted) return;

        const params = new URLSearchParams();
        if (selectedRole !== 'ALL') params.set('role', selectedRole);
        if (selectedRank !== 'CHALLENGER' && selectedRank !== 'ALL') params.set('rank', selectedRank);

        // Replace URL without reloading
        router.replace(`?${params.toString()}`, { scroll: false });

        loadData();
    }, [selectedRole, selectedRank, isMounted]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await TierListService.getTierList(selectedRole, selectedRank);
            setData(result);
        } catch (error) {
            console.error("Failed to load tier list", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof ChampionTier) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...data];

        // Filter by search
        if (searchQuery) {
            sortableItems = sortableItems.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Custom sort for Tier
                if (sortConfig.key === 'tier') {
                    const tierOrder: Record<string, number> = { 'S+': 6, 'S': 5, 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
                    const diff = tierOrder[b.tier] - tierOrder[a.tier];
                    return sortConfig.direction === 'asc' ? -diff : diff;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig, searchQuery]);

    return {
        selectedRole, setSelectedRole,
        selectedRank, setSelectedRank,
        searchQuery, setSearchQuery,
        sortedData,
        loading,
        sortConfig,
        handleSort
    };
}
