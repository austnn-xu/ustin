import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Coin } from '@/components/art/Coin';
import { Confetti } from '@/components/art/Confetti';
import { Mascot, type Mood } from '@/components/art/Mascot';
import { Button, ChoiceCard, Icon, PressableScale, Screen, Text } from '@/components/ui';
import { COINS, COSMETICS, findCosmetic, SLOTS, type Cosmetic, type Slot } from '@/lib/cosmetics';
import { haptics } from '@/lib/haptics';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';

/** The shop: spend lesson coins on things for Tin to wear, and try anything on before buying it. */
export default function Shop() {
  const t = useTheme();
  const styles = useStyles();
  const coins = useProgress((s) => s.coins);
  const owned = useProgress((s) => s.owned);
  const equipped = useProgress((s) => s.equipped);
  const buy = useProgress((s) => s.buy);
  const equip = useProgress((s) => s.equip);
  const [slot, setSlot] = useState<Slot>('hat');
  const [trying, setTrying] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const [mood, setMood] = useState<Mood>('happy');

  const item = findCosmetic(trying ?? undefined);
  // Tin on the stand wears the current outfit, with whatever is being tried on swapped in.
  const preview = item ? { ...equipped, [item.slot]: item.id } : equipped;
  const items = COSMETICS.filter((c) => c.slot === slot);

  const select = (c: Cosmetic) => {
    setTrying((id) => (id === c.id ? null : c.id));
    setMood('wow');
  };

  const onBuy = (c: Cosmetic) => {
    if (buy(c.id) === 'bought') {
      haptics.success();
      setCelebrate((n) => n + 1);
      setMood('cheer');
      setTrying(null);
    } else {
      haptics.error();
    }
  };

  let action: React.ReactNode = (
    <Text variant="callout" color="textSecondary" align="center">
      Tap anything to try it on.
    </Text>
  );
  if (item) {
    const isOwned = owned[item.id] !== undefined;
    const isOn = equipped[item.slot] === item.id;
    if (!isOwned) {
      action =
        coins >= item.price ? (
          <Button label={`Buy ${item.name} for ${item.price}`} fullWidth onPress={() => onBuy(item)} />
        ) : (
          <Button label={`${item.price - coins} more coins needed`} disabled fullWidth />
        );
    } else if (!isOn) {
      action = (
        <Button
          label={`Wear ${item.name}`}
          variant="secondary"
          fullWidth
          onPress={() => {
            haptics.light();
            equip(item.slot, item.id);
            setTrying(null);
            setMood('cheer');
          }}
        />
      );
    } else {
      action =
        item.slot === 'paint' ? (
          <Button label="You're wearing this" variant="neutral" disabled fullWidth />
        ) : (
          <Button
            label={`Take off ${item.name}`}
            variant="neutral"
            fullWidth
            onPress={() => {
              equip(item.slot, null);
              setTrying(null);
              setMood('happy');
            }}
          />
        );
    }
  }

  return (
    <Screen gutter={false} footer={action}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Text variant="display" style={styles.flex}>
              Shop
            </Text>
            <View style={styles.wallet} accessibilityLabel={`${coins} coins`}>
              <Coin size={t.layout.icon.lg} />
              <Text variant="title" hue="yellow" tabular>
                {coins}
              </Text>
            </View>
          </View>

          <View style={styles.stage}>
            <Mascot mood={mood} size="xl" outfit={preview} />
            <View style={styles.podium} />
            <Text variant="heading" align="center">
              {item ? item.name : 'Your Tin'}
            </Text>
            <Text variant="caption" color="textSecondary" align="center">
              {`Earn coins in lessons: ${COINS.correct} per right answer, +${COINS.combo5} for 5 in a row, +${COINS.combo10} for 10 in a row.`}
            </Text>
          </View>

          <View style={styles.tabs}>
            {SLOTS.map((s) => (
              <PressableScale
                key={s.id}
                haptic="selection"
                accessibilityRole="tab"
                accessibilityState={{ selected: s.id === slot }}
                accessibilityLabel={s.label}
                onPress={() => {
                  setSlot(s.id);
                  setTrying(null);
                }}
                style={[styles.tab, s.id === slot && styles.tabOn]}
              >
                <Text variant="callout" hue={s.id === slot ? 'purple' : undefined} color="textSecondary">
                  {s.label}
                </Text>
              </PressableScale>
            ))}
          </View>

          <View style={styles.grid}>
            {items.map((c) => {
              const isOwned = owned[c.id] !== undefined;
              const isOn = equipped[c.slot] === c.id;
              return (
                <ChoiceCard
                  key={c.id}
                  state={trying === c.id ? 'selected' : 'idle'}
                  onPress={() => select(c)}
                  accessibilityLabel={`${c.name}, ${isOn ? 'wearing' : isOwned ? 'owned' : `${c.price} coins`}`}
                  style={styles.cell}
                >
                  <View style={styles.cellBody}>
                    <Mascot size="sm" idle={false} outfit={c.slot === 'paint' ? { paint: c.id } : { [c.slot]: c.id, paint: equipped.paint }} />
                    <Text variant="callout" align="center" numberOfLines={2} style={styles.name}>
                      {c.name}
                    </Text>
                    {isOn ? (
                      <Text variant="label" hue="green">
                        Wearing
                      </Text>
                    ) : isOwned ? (
                      <Text variant="label" hue="blue">
                        Owned
                      </Text>
                    ) : (
                      <View style={styles.price}>
                        {coins < c.price ? <Icon icon={Lock} size="sm" color="textTertiary" /> : <Coin size={t.layout.icon.sm} />}
                        <Text variant="callout" hue={coins >= c.price ? 'yellow' : undefined} color="textTertiary" tabular>
                          {c.price}
                        </Text>
                      </View>
                    )}
                  </View>
                </ChoiceCard>
              );
            })}
          </View>
        </View>
      </ScrollView>
      {celebrate > 0 && <Confetti key={celebrate} />}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingTop: t.space[4], paddingBottom: t.space[8] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[4] },
  header: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[1.5],
    paddingHorizontal: t.space[3],
    paddingVertical: t.space[1],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.hue.yellow.subtle,
  },
  stage: {
    alignItems: 'center',
    gap: t.space[1],
    paddingTop: t.space[4],
    paddingBottom: t.space[4],
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.hue.purple.subtle,
  },
  podium: {
    width: t.layout.mascot.lg,
    height: t.space[4],
    marginTop: -t.space[3],
    marginBottom: t.space[2],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.hue.purple.base,
    borderBottomWidth: t.layout.depth.md,
    borderBottomColor: t.colors.hue.purple.depth,
  },
  tabs: { flexDirection: 'row', gap: t.space[2] },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.space[2],
    borderRadius: t.radius.pill,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
  },
  tabOn: { borderColor: t.colors.hue.purple.base, backgroundColor: t.colors.hue.purple.subtle },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  cell: { flexBasis: '30%', flexGrow: 1, maxWidth: '32%' },
  cellBody: { alignItems: 'center', gap: t.space[1] },
  price: { flexDirection: 'row', alignItems: 'center', gap: t.space[1] },
  /** Two lines' worth, so prices line up across a row whatever the name length. */
  name: { minHeight: t.type.callout.lineHeight! * 2, textAlignVertical: 'center' },
}));
