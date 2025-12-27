
import Image from 'next/image';
import { getRuneIconUrl } from '@/utils/ddragon';

interface RunePage {
    primaryStyle: number;
    subStyle: number;
    perks: number[];
    statPerks?: Record<string, number>;
    winRate: number;
    matches: number;
}

interface RuneTreeData {
    id: number;
    key: string;
    icon: string;
    name: string;
    slots: { runes: { id: number; icon: string; key: string; name: string }[] }[];
}

interface ChampionRunesProps {
    championName: string;
    role: string;
    runePages: RunePage[];
    allRunes: RuneTreeData[];
    runeMap: Record<number, string>;
}

const ID_HEALTH_PLUS = 5001;
const ID_ARMOR = 5002;
const ID_MAGIC_RES = 5003;
const ID_ATTACK_SPEED = 5005;
const ID_ADAPTIVE_FORCE = 5008;
const ID_CDR_SCALING = 5007;
const ID_MOVE_SPEED = 5010;
const ID_TENACITY = 5011;
const ID_HEALTH_SCALING = 5013;

const RUNE_IDS = {
    HEALTH_PLUS: ID_HEALTH_PLUS,
    ARMOR: ID_ARMOR,
    MAGIC_RES: ID_MAGIC_RES,
    ATTACK_SPEED: ID_ATTACK_SPEED,
    ADAPTIVE_FORCE: ID_ADAPTIVE_FORCE,
    CDR_SCALING: ID_CDR_SCALING,
    MOVE_SPEED: ID_MOVE_SPEED,
    TENACITY: ID_TENACITY,
    HEALTH_SCALING: ID_HEALTH_SCALING
};

const SHARD_MAP: Record<number, string> = {
    [RUNE_IDS.HEALTH_PLUS]: 'StatModsHealthPlusIcon.png',
    [RUNE_IDS.ARMOR]: 'StatModsArmorIcon.png',
    [RUNE_IDS.MAGIC_RES]: 'StatModsMagicResIcon.png',
    [RUNE_IDS.ATTACK_SPEED]: 'StatModsAttackSpeedIcon.png',
    [RUNE_IDS.ADAPTIVE_FORCE]: 'StatModsAdaptiveForceIcon.png',
    [RUNE_IDS.CDR_SCALING]: 'StatModsCDRScalingIcon.png',
    [RUNE_IDS.MOVE_SPEED]: 'StatModsMovementSpeedIcon.png',
    [RUNE_IDS.TENACITY]: 'StatModsTenacityIcon.png',
    [RUNE_IDS.HEALTH_SCALING]: 'StatModsHealthScalingIcon.png'
};

const SHARD_ROWS = [
    [RUNE_IDS.ADAPTIVE_FORCE, RUNE_IDS.ATTACK_SPEED, RUNE_IDS.CDR_SCALING], // Offense
    [RUNE_IDS.ADAPTIVE_FORCE, RUNE_IDS.MOVE_SPEED, RUNE_IDS.HEALTH_PLUS], // Flex
    [RUNE_IDS.HEALTH_PLUS, RUNE_IDS.TENACITY, RUNE_IDS.HEALTH_SCALING]  // Defense
];

const getShardIcon = (id: number) => {
    return SHARD_MAP[id] ? getRuneIconUrl(`perk-images/StatMods/${SHARD_MAP[id]}`) : '';
};

interface RuneTreeProps {
    tree: RuneTreeData;
    page: RunePage;
    isPrimary: boolean;
    getRuneIcon: (id: number) => string;
}

const RUNE_ICON_SIZE_PRIMARY = 40;
const RUNE_ICON_SIZE_LARGE = 56;
const RUNE_ICON_SIZE_SMALL = 48;
const SHARD_CONTAINER_SIZE = 12;
const SHARD_IMAGE_SIZE = 48;

const RuneTree = ({ tree, page, isPrimary, getRuneIcon }: RuneTreeProps) => {
    if (!tree) return null;
    const slots = isPrimary ? tree.slots : tree.slots.slice(1);
    const activeColor = isPrimary ? 'border-lol-gold shadow-[0_0_15px_rgba(200,155,60,0.5)]' : 'border-lol-blue shadow-[0_0_15px_rgba(0,200,255,0.5)]';

    return (
        <div className="bg-[#161616] rounded-xl p-8 border border-white/5">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
                <Image src={getRuneIcon(isPrimary ? page.primaryStyle : page.subStyle)} alt={isPrimary ? 'Primary Style' : 'Sub Style'} width={RUNE_ICON_SIZE_PRIMARY} height={RUNE_ICON_SIZE_PRIMARY} className="w-10 h-10" />
                <span className="text-2xl font-bold text-white">{tree.name || (isPrimary ? 'Primary' : 'Secondary')}</span>
            </div>

            <div className={`space-y-8 ${!isPrimary ? 'mb-10' : ''}`}>
                {slots.map((slot, sIdx) => (
                    <RuneRow key={sIdx} slot={slot} page={page} isPrimary={isPrimary} activeColor={activeColor} />
                ))}
            </div>
            {!isPrimary && <ShardSection page={page} />}
        </div>
    );
};

interface Rune {
    id: number;
    icon: string;
    key: string;
    name: string;
}

interface RuneSlot {
    runes: Rune[];
}

interface RuneRowProps {
    slot: RuneSlot;
    page: RunePage;
    isPrimary: boolean;
    activeColor: string;
}

const RuneRow = ({ slot, page, isPrimary, activeColor }: RuneRowProps) => {
    const getRuneIconClass = (active: boolean) => {
        const sizeClass = isPrimary ? 'w-14 h-14' : 'w-12 h-12';
        const stateClass = active ? `${activeColor} opacity-100 scale-110` : 'border-transparent opacity-30 grayscale hover:opacity-60';
        return `${sizeClass} rounded-full border-2 transition-all ${stateClass}`;
    };

    return (
        <div className="flex justify-between items-center px-4">
            {slot.runes.map((rune: Rune) => {
                const active = page.perks.includes(rune.id);
                return (
                    <div key={rune.id} className="relative group">
                        <Image
                            src={getRuneIconUrl(rune.icon)}
                            alt={`Rune ${rune.id}`}
                            width={isPrimary ? RUNE_ICON_SIZE_LARGE : RUNE_ICON_SIZE_SMALL}
                            height={isPrimary ? RUNE_ICON_SIZE_LARGE : RUNE_ICON_SIZE_SMALL}
                            className={getRuneIconClass(active)}
                        />
                    </div>
                );
            })}
        </div>
    );
};

const ShardSection = ({ page }: { page: RunePage }) => (
    <div className="pt-8 border-t border-white/5">
        <div className="space-y-4">
            {SHARD_ROWS.map((rowIds, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-8">
                    {rowIds.map((shardId) => {
                        let active = false;
                        if (page.perks.length >= 9) {
                            const shardIndex = page.perks.length - 3 + rowIdx;
                            active = page.perks[shardIndex] === shardId;
                        } else {
                            active = page.perks.includes(shardId) || (page.statPerks && Object.values(page.statPerks).includes(shardId));
                        }

                        const iconUrl = getShardIcon(shardId);
                        const activeClass = 'border-white opacity-100 scale-110 bg-[#333]';
                        const inactiveClass = 'border-transparent opacity-20 grayscale bg-[#222]';

                        return (
                            <div key={shardId} className={`relative w-${SHARD_CONTAINER_SIZE} h-${SHARD_CONTAINER_SIZE} rounded-full border-2 transition-all ${active ? activeClass : inactiveClass}`}>
                                {iconUrl && <Image src={iconUrl} alt={`Shard ${shardId}`} width={SHARD_IMAGE_SIZE} height={SHARD_IMAGE_SIZE} className="w-full h-full p-1" />}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    </div>
);

export const ChampionRunes: React.FC<ChampionRunesProps> = ({ championName, role, runePages, allRunes, runeMap }) => {
    const getRuneIcon = (id: number) => {
        if (!runeMap[id]) return getRuneIconUrl('rune/8000.png'); // Fallback
        return getRuneIconUrl(runeMap[id]);
    };

    if (!runePages || runePages.length === 0) {
        return (
            <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between bg-[#1a1a1a] px-6 py-3 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white">Recommended</h3>
                    </div>
                </div>
                <div className="text-gray-500 text-sm p-6">No rune data available.</div>
            </div>
        );
    }

    const page = runePages[0];
    const primaryTree = allRunes.find((t) => t.id === page.primaryStyle);
    const subTree = allRunes.find((t) => t.id === page.subStyle);

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-[#1a1a1a] px-6 py-3 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Recommended</h3>
                    <div className="flex gap-1">
                        <Image src={getRuneIcon(page.primaryStyle)} alt="Primary Style" width={20} height={20} className="w-5 h-5" />
                        <Image src={getRuneIcon(page.subStyle)} alt="Sub Style" width={20} height={20} className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Header Info */}
                <div className="flex justify-between items-center mb-6 border-l-4 border-lol-blue pl-4">
                    <div>
                        <h4 className="text-xl font-bold text-white">{championName} Runes</h4>
                        <div className="text-sm text-gray-500">{role} Build</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-white">{page.winRate.toFixed(2)}% WR</div>
                        <div className="text-sm text-gray-500">{page.matches.toLocaleString()} Matches</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RuneTree tree={primaryTree} page={page} isPrimary={true} getRuneIcon={getRuneIcon} />
                    <RuneTree tree={subTree} page={page} isPrimary={false} getRuneIcon={getRuneIcon} />
                </div>
            </div>
        </div>
    );
};
