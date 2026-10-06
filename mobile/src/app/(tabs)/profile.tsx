import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { BookOpen, Check, Flame, Lock, ScanLine, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Mascot } from '@/components/art/Mascot';
import { LocationPicker, LocationPill } from '@/components/places/LocationPicker';
import { Button, Card, ChoiceCard, Icon, ProgressBar, Screen, Text } from '@/components/ui';
import { ACHIEVEMENTS, isUnlocked } from '@/lib/achievements';
import { dayKey, lastWeek, weekdayLetter } from '@/lib/dates';
import { GOALS } from '@/lib/goals';
import { currentStreak, useProgress } from '@/stores/progress';
import { useSettings, type ColorSchemePreference } from '@/stores/settings';
import { makeStyles, useTheme, type HueName } from '@/theme';

const SCHEMES: { value: ColorSchemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Profile() {
  const styles = useStyles();
  const progress = useProgress();
  const settings = useSettings();
  const [editingPlace, setEditingPlace] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const streak = currentStreak(progress.streak);
  const today = dayKey();

  return (
    <Screen scroll keyboard>
      <View style={styles.stack}>
        <View style={styles.hero}>
          <Mascot mood={streak.doneToday ? 'cheer' : 'happy'} size="md" />
          <View style={styles.flex}>
            <Text variant="display">Your progress</Text>
            <Text variant="body" color="textSecondary">
              {streak.doneToday ? 'You showed up today. Tin is proud of you!' : 'A quick lesson keeps your streak alive.'}
            </Text>
          </View>
        </View>
        <Button label={`Dress up Tin · ${progress.coins} coins`} variant="secondary" fullWidth onPress={() => router.push('/shop')} />

        <View style={styles.grid}>
          <Stat icon={Flame} hue="orange" value={streak.count} label="Day streak" filled />
          <Stat icon={Zap} hue="yellow" value={progress.xp} label="Total XP" filled />
          <Stat icon={BookOpen} hue="green" value={Object.keys(progress.lessons).length} label="Lessons done" />
          <Stat icon={ScanLine} hue="blue" value={Object.keys(progress.sorted).length} label="Items sorted" />
        </View>

        <Card style={styles.gap}>
          <View style={styles.between}>
            <Text variant="heading">This week</Text>
            <Text variant="callout" color="textSecondary">{`Best streak: ${progress.streak.best}`}</Text>
          </View>
          <View style={styles.week}>
            {lastWeek(today).map((d) => {
              const xp = progress.xpByDay[d] ?? 0;
              return (
                <View key={d} style={styles.day}>
                  <Text variant="label" color={d === today ? 'text' : 'textTertiary'}>
                    {weekdayLetter(d)}
                  </Text>
                  <View style={[styles.dot, xp > 0 && styles.dotOn]}>{xp > 0 && <Icon icon={Check} size="sm" color="onColor" />}</View>
                  <Text variant="caption" color="textTertiary" tabular>
                    {xp > 0 ? `${xp}` : ' '}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Text variant="title">Achievements</Text>
        <Card padding="none">
          {ACHIEVEMENTS.map((a, i) => {
            const unlocked = isUnlocked(a, progress);
            const value = Math.min(a.value(progress), a.goal);
            return (
              <View key={a.id} style={[styles.badgeRow, i > 0 && styles.rowBorder]}>
                <BadgeTile icon={unlocked ? a.icon : Lock} hue={unlocked ? a.hue : null} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{a.title}</Text>
                  <Text variant="caption" color="textSecondary">
                    {a.description}
                  </Text>
                  {!unlocked && (
                    <View style={styles.badgeProgress}>
                      <ProgressBar value={value / a.goal} hue={a.hue} size="sm" accessibilityLabel={`${a.title} progress`} />
                      <Text variant="caption" color="textTertiary" tabular>{`${value}/${a.goal}`}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        <Text variant="title">Settings</Text>

        <Text variant="label" color="textSecondary">
          Daily goal
        </Text>
        <View style={styles.goals}>
          {GOALS.map((g) => (
            <ChoiceCard
              key={g.value}
              state={settings.dailyGoal === g.value ? 'selected' : 'idle'}
              onPress={() => settings.setDailyGoal(g.value)}
              accessibilityLabel={`${g.label}, ${g.value} XP a day`}
              style={styles.half}
            >
              <Text variant="bodyStrong">{g.label}</Text>
              <Text variant="caption" color="textSecondary">{`${g.value} XP · ${g.blurb}`}</Text>
            </ChoiceCard>
          ))}
        </View>

        <Text variant="label" color="textSecondary">
          Your location
        </Text>
        {editingPlace || !settings.place ? (
          <Card style={styles.gap}>
            <LocationPicker onDone={() => setEditingPlace(false)} />
            {settings.place && <Button label="Cancel" variant="ghost" fullWidth onPress={() => setEditingPlace(false)} />}
          </Card>
        ) : (
          <LocationPill onPress={() => setEditingPlace(true)} />
        )}

        <Text variant="label" color="textSecondary">
          Appearance
        </Text>
        <View style={styles.goals}>
          {SCHEMES.map((s) => (
            <ChoiceCard
              key={s.value}
              state={settings.colorScheme === s.value ? 'selected' : 'idle'}
              onPress={() => settings.setColorScheme(s.value)}
              accessibilityLabel={`${s.label} appearance`}
              style={styles.third}
            >
              <Text variant="bodyStrong" align="center">
                {s.label}
              </Text>
            </ChoiceCard>
          ))}
        </View>

        {confirmReset ? (
          <Card variant="tinted" hue="red" style={styles.gap}>
            <Text variant="bodyStrong" hue="red">
              Reset all progress? Your XP, streak, lessons, badges, coins and Tin's outfits will be gone for good.
            </Text>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button label="Keep it" variant="neutral" fullWidth onPress={() => setConfirmReset(false)} />
              </View>
              <View style={styles.flex}>
                <Button
                  label="Reset"
                  variant="danger"
                  fullWidth
                  onPress={() => {
                    progress.reset();
                    setConfirmReset(false);
                  }}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Button label="Reset progress" variant="ghost" hue="red" fullWidth onPress={() => setConfirmReset(true)} />
        )}
      </View>
    </Screen>
  );
}

function Stat({ icon, hue, value, label, filled }: { icon: LucideIcon; hue: HueName; value: number; label: string; filled?: boolean }) {
  const styles = useStyles();
  return (
    <Card style={styles.stat}>
      <Icon icon={icon} size="lg" hue={hue} filled={filled} />
      <View style={styles.flex}>
        <Text variant="title" tabular>
          {value}
        </Text>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      </View>
    </Card>
  );
}

function BadgeTile({ icon, hue }: { icon: LucideIcon; hue: HueName | null }) {
  const t = useTheme();
  const styles = useStyles();
  const h = hue ? t.colors.hue[hue] : null;
  return (
    <View style={[styles.badgeTile, h ? { backgroundColor: h.base, borderBottomColor: h.depth } : styles.badgeLocked]}>
      <Icon icon={icon} size="lg" color={h ? 'onColor' : 'textTertiary'} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stack: { gap: t.space[4], paddingTop: t.space[4] },
  hero: { flexDirection: 'row', alignItems: 'center', gap: t.space[4] },
  flex: { flex: 1 },
  gap: { gap: t.space[3] },
  row: { flexDirection: 'row', gap: t.space[3] },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  stat: { flexBasis: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: t.space[1] },
  dot: {
    width: t.space[8],
    height: t.space[8],
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: t.colors.hue.orange.base },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], padding: t.space[4] },
  rowBorder: { borderTopWidth: t.layout.border, borderTopColor: t.colors.border },
  badgeTile: {
    width: t.layout.art.md,
    height: t.layout.art.md,
    borderRadius: t.radius.lg,
    borderBottomWidth: t.layout.depth.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: { backgroundColor: t.colors.fill, borderBottomColor: t.colors.fillStrong },
  badgeProgress: { flexDirection: 'row', alignItems: 'center', gap: t.space[2], marginTop: t.space[1] },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  half: { flexBasis: '46%', flexGrow: 1 },
  third: { flexBasis: '30%', flexGrow: 1 },
}));
