import { Image } from 'expo-image';
import {
  ArrowRight,
  Camera,
  Check,
  Clock,
  List,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Recycle,
  Search,
  ShieldAlert,
  Trash,
} from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Icon,
  Input,
  ListRow,
  Screen,
  Sheet,
  Skeleton,
  SkeletonText,
  Text,
  type SheetRef,
} from '@/components/ui';
import { usePreferences, type ColorSchemePreference } from '@/stores/preferences';
import { makeStyles, useTheme, type ColorTokens } from '@/theme';

const CARD_IMAGE_RATIO = 2;

/**
 * Design-system gallery. Every primitive, every state, both themes.
 * Sample content is the coffee cup from ../lib/rules.js. Dev-only; not part of the product navigation.
 */
export default function Primitives() {
  const styles = useStyles();

  return (
    <Screen scroll keyboard gutter={false}>
      <View style={[styles.gutter, styles.header]}>
        <Text variant="label" color="textTertiary">
          Design system
        </Text>
        <Text variant="display">Primitives</Text>
        <AppearancePicker />
      </View>

      <Section title="Type">
        <TypeScale />
      </Section>

      <Section title="Color">
        <Swatches />
      </Section>

      <Section title="Button">
        <Buttons />
      </Section>

      <Section title="Input">
        <Inputs />
      </Section>

      <Section title="Badge">
        <View style={styles.wrap}>
          <Badge label="#5 PP" />
          <Badge label="Widely accepted" tone="accent" dot />
          <Badge label="Varies by program" dot />
          <Badge label="Rarely accepted curbside" dot />
          <Badge label="Hazardous" tone="danger" icon={ShieldAlert} />
          <Badge label="3 parts" tone="inverse" />
        </View>
      </Section>

      <Section title="Avatar">
        <View style={styles.rowCenter}>
          <Avatar name="Maya Okafor" size="xl" />
          <Avatar name="Daniel Reyes" size="lg" />
          <Avatar name="Priya Natarajan" size="md" />
          <Avatar name="Tomás Lindqvist" size="sm" />
          <Avatar name="Aiko Hayashi" size="xs" />
        </View>
      </Section>

      <Section title="Card">
        <Cards />
      </Section>

      <Section title="List row" bleed>
        <ListRow
          icon={Trash}
          title="Cup body"
          subtitle="Paper with a fused plastic lining. Very few facilities can separate the two."
          trailing={<Badge label="Trash" />}
          onPress={() => {}}
        />
        <Divider inset />
        <ListRow
          icon={Recycle}
          title="Lid"
          subtitle="Rigid #5 plastic. Put it in loose, not pushed inside the cup."
          trailing={<Badge label="#5 PP" tone="accent" />}
          onPress={() => {}}
        />
        <Divider inset />
        <ListRow
          leading={<Avatar name="Maya Okafor" />}
          title="Maya Okafor"
          subtitle="maya.okafor@fastmail.com"
          onPress={() => {}}
        />
        <Divider inset />
        <ListRow icon={MapPin} title="Location" value="San Francisco" onPress={() => {}} />
        <Divider inset />
        <ListRow icon={Clock} title="Scan history" value="38" onPress={() => {}} />
        <Divider inset />
        <ListRow icon={Moon} title="Appearance" trailing={<Badge label="System" />} onPress={() => {}} />
        <Divider inset />
        <ListRow icon={LogOut} title="Sign out" destructive chevron={false} onPress={() => {}} />
      </Section>

      <Section title="Skeleton">
        <Skeletons />
      </Section>

      <Section title="Sheet">
        <SheetDemo />
      </Section>
    </Screen>
  );
}

function Section({ title, children, bleed = false }: { title: string; children: ReactNode; bleed?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.gutter}>
        <Text variant="title">{title}</Text>
      </View>
      <View style={bleed ? undefined : [styles.gutter, styles.sectionBody]}>{children}</View>
    </View>
  );
}

function AppearancePicker() {
  const styles = useStyles();
  const scheme = usePreferences((s) => s.colorScheme);
  const setScheme = usePreferences((s) => s.setColorScheme);
  const options: { value: ColorSchemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Button
          key={o.value}
          size="sm"
          label={o.label}
          variant={scheme === o.value ? 'secondary' : 'ghost'}
          onPress={() => setScheme(o.value)}
        />
      ))}
    </View>
  );
}

function TypeScale() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Text variant="display">Disposable coffee cup</Text>
      <Text variant="title">Three parts, three bins</Text>
      <Text variant="heading">Pull it apart before you bin it</Text>
      <Text variant="body">
        The waterproof plastic lining is fused to the paper. Very few facilities can separate the two.
      </Text>
      <Text variant="bodyStrong">Lid · #5 PP</Text>
      <Text variant="callout" color="textSecondary">
        Polypropylene · Widely accepted
      </Text>
      <Text variant="caption" color="textTertiary">
        Scanned 2 min ago
      </Text>
      <Text variant="label" color="textTertiary">
        Components
      </Text>
    </View>
  );
}

function Swatches() {
  const t = useTheme();
  const styles = useStyles();
  const keys: (keyof ColorTokens)[] = [
    'bg',
    'bgSubtle',
    'fill',
    'fillStrong',
    'border',
    'borderStrong',
    'textTertiary',
    'textSecondary',
    'text',
    'accent',
    'accentSubtle',
    'danger',
  ];
  return (
    <View style={styles.swatchGrid}>
      {keys.map((k) => (
        <View key={k} style={styles.swatch}>
          <View style={[styles.swatchChip, { backgroundColor: t.colors[k] }]} />
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {k}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Buttons() {
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const identify = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1600);
  };
  return (
    <View style={styles.stack}>
      <Button label="Scan an item" size="lg" icon={Camera} fullWidth loading={loading} onPress={identify} />
      <View style={styles.wrap}>
        <Button label="Pick from list" variant="secondary" icon={List} />
        <Button label="Not it?" variant="outline" />
        <Button label="Skip" variant="ghost" />
      </View>
      <View style={styles.wrap}>
        <Button label="Clear history" variant="destructive" />
        <Button label="Find a drop-off" disabled />
      </View>
      <View style={styles.rowCenter}>
        <Button label="Small" size="sm" />
        <Button label="Medium" size="md" />
        <Button label="Next" size="lg" icon={ArrowRight} iconPosition="trailing" />
      </View>
    </View>
  );
}

function Inputs() {
  const styles = useStyles();
  const [query, setQuery] = useState('pizza box');
  const [zip, setZip] = useState('9411');
  const [email, setEmail] = useState('');
  return (
    <View style={styles.stack}>
      <Input
        icon={Search}
        placeholder="Search items, like “battery” or “takeout tray”"
        value={query}
        onChangeText={setQuery}
        clearable
      />
      <Input
        label="ZIP code"
        icon={MapPin}
        keyboardType="number-pad"
        maxLength={5}
        value={zip}
        onChangeText={setZip}
        error={/^\d{5}$/.test(zip) ? undefined : 'ZIP codes are 5 digits.'}
      />
      <Input
        label="Email"
        icon={Mail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        hint="Optional. Keeps your scan history across devices."
      />
      <Input label="Local program" icon={Recycle} value="San Francisco curbside" editable={false} />
    </View>
  );
}

function Cards() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Card padding="none" onPress={() => {}} accessibilityLabel="Disposable coffee cup, scanned 2 minutes ago">
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80' }}
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.cardBody}>
          <Text variant="heading" numberOfLines={1}>
            Disposable coffee cup
          </Text>
          <Text variant="caption" color="textSecondary">
            Scanned 2 min ago · 3 parts
          </Text>
          <View style={styles.wrap}>
            <Badge label="2 recycle" tone="accent" icon={Recycle} />
            <Badge label="1 trash" icon={Trash} />
          </View>
        </View>
      </Card>

      <Card variant="filled">
        <View style={styles.stackTight}>
          <Text variant="label" color="textTertiary">
            Where each part goes
          </Text>
          <BreakdownRow part="Cup body" bin="Trash" />
          <BreakdownRow part="Lid" bin="Recycling · #5 PP" />
          <BreakdownRow part="Sleeve" bin="Recycling · PAP" />
          <Divider />
          <Text variant="caption" color="textSecondary">
            Three materials, three destinations. Pull it apart before you bin it.
          </Text>
        </View>
      </Card>

      <Card variant="floating">
        <View style={styles.rowCenter}>
          <View style={styles.flex}>
            <Text variant="bodyStrong">Looks like a pizza box</Text>
            <Text variant="caption" color="textSecondary">
              One question, then you’ll know.
            </Text>
          </View>
          <Button label="Not it?" size="sm" variant="secondary" />
          <Button label="Yes" size="sm" />
        </View>
      </Card>
    </View>
  );
}

function BreakdownRow({ part, bin }: { part: string; bin: string }) {
  const styles = useStyles();
  return (
    <View style={styles.rowBetween}>
      <Text variant="body">{part}</Text>
      <Text variant="body" color="textSecondary">
        {bin}
      </Text>
    </View>
  );
}

function Skeletons() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Card padding="none">
        <Skeleton radius="none" aspectRatio={CARD_IMAGE_RATIO} />
        <View style={styles.cardBody}>
          <SkeletonText lines={1} variant="heading" />
          <SkeletonText lines={1} variant="caption" />
          <View style={styles.wrap}>
            <Skeleton width="28%" height={t.space[6]} />
            <Skeleton width="22%" height={t.space[6]} />
          </View>
        </View>
      </Card>
      <View style={styles.rowCenter}>
        <Skeleton height={t.layout.avatar.md} width={t.layout.avatar.md} radius="md" />
        <View style={styles.flex}>
          <SkeletonText lines={2} variant="caption" />
        </View>
      </View>
    </View>
  );
}

function SheetDemo() {
  const styles = useStyles();
  const sheet = useRef<SheetRef>(null);
  const [cupType, setCupType] = useState<'paper' | 'plastic' | null>(null);
  const options = [
    { value: 'paper', label: 'Paper (hot cup)' },
    { value: 'plastic', label: 'Clear plastic (cold cup)' },
  ] as const;

  return (
    <>
      <Button label="Ask a follow-up question" variant="outline" onPress={() => sheet.current?.present()} />
      <Sheet ref={sheet} title="Is the cup plastic or paper?">
        <View style={styles.gutter}>
          <Text variant="body" color="textSecondary">
            A clear plastic cold cup and a lined paper hot cup are different materials.
          </Text>
        </View>
        <View>
          {options.map((o, i) => (
            <View key={o.value}>
              {i > 0 && <Divider />}
              <ListRow
                title={o.label}
                chevron={false}
                trailing={cupType === o.value ? <Icon icon={Check} color="accent" /> : null}
                onPress={() => setCupType(o.value)}
              />
            </View>
          ))}
        </View>
        <View style={[styles.gutter, styles.stackTight]}>
          <Button
            label="Continue"
            size="lg"
            fullWidth
            disabled={!cupType}
            onPress={() => sheet.current?.dismiss()}
          />
          <Button label="Not sure, skip" variant="ghost" fullWidth onPress={() => sheet.current?.dismiss()} />
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  gutter: { paddingHorizontal: t.layout.gutter },
  header: { gap: t.space[3], paddingTop: t.space[4] },
  section: { marginTop: t.layout.section, gap: t.space[4] },
  sectionBody: { gap: t.space[4] },
  stack: { gap: t.space[4] },
  stackTight: { gap: t.space[2] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[3] },
  flex: { flex: 1 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: t.space[4] },
  swatch: { width: '25%', gap: t.space[2], paddingRight: t.space[2] },
  swatchChip: {
    height: t.space[12],
    borderRadius: t.radius.sm,
    borderWidth: t.layout.hairline,
    borderColor: t.colors.borderStrong,
  },
  cardImage: { width: '100%', aspectRatio: CARD_IMAGE_RATIO, backgroundColor: t.colors.fill },
  cardBody: { padding: t.space[4], gap: t.space[2] },
}));
