import { Image } from 'expo-image';
import {
  ArrowRight,
  Bell,
  CreditCard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
} from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
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
 * Dev-only; not part of the product navigation.
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
          <Badge label="Open now" tone="accent" dot />
          <Badge label="Closes 5:00 PM" />
          <Badge label="#5 PP accepted" />
          <Badge label="Hazardous" tone="danger" icon={ShieldAlert} />
          <Badge label="New" tone="inverse" />
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
          leading={<Avatar name="Maya Okafor" />}
          title="Maya Okafor"
          subtitle="maya.okafor@fastmail.com"
          onPress={() => {}}
        />
        <Divider inset />
        <ListRow icon={CreditCard} title="Payment" value="Visa •••• 4242" onPress={() => {}} />
        <Divider inset />
        <ListRow icon={Bell} title="Notifications" subtitle="Pickup reminders, driver updates" onPress={() => {}} />
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
      <Text variant="display">Drop-off near you</Text>
      <Text variant="title">Recology San Francisco</Text>
      <Text variant="heading">Saturday pickup window</Text>
      <Text variant="body">
        Rinse containers and leave lids on. Flattened cardboard goes next to the bin, not inside it.
      </Text>
      <Text variant="bodyStrong">$24.00 · bulky item pickup</Text>
      <Text variant="callout" color="textSecondary">
        2.4 mi · Open until 5:00 PM
      </Text>
      <Text variant="caption" color="textTertiary">
        Updated 3 min ago
      </Text>
      <Text variant="label" color="textTertiary">
        Accepted materials
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
  const book = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1600);
  };
  return (
    <View style={styles.stack}>
      <Button label="Schedule pickup" size="lg" fullWidth loading={loading} onPress={book} />
      <View style={styles.wrap}>
        <Button label="Directions" variant="secondary" icon={Navigation} />
        <Button label="Save" variant="outline" />
        <Button label="Skip" variant="ghost" />
      </View>
      <View style={styles.wrap}>
        <Button label="Cancel pickup" variant="destructive" />
        <Button label="Unavailable" disabled />
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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('maya.okafor@');
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('Batteries');
  return (
    <View style={styles.stack}>
      <Input
        label="Phone number"
        icon={Phone}
        placeholder="(415) 555-0132"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        value={phone}
        onChangeText={setPhone}
        hint="We'll text you a 6-digit code."
      />
      <Input
        label="Email"
        icon={Mail}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={/^\S+@\S+\.\S+$/.test(email) ? undefined : 'Enter a full email address, like name@example.com.'}
      />
      <Input
        label="Password"
        icon={Lock}
        secureTextEntry
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
      />
      <Input icon={Search} placeholder="Search items or places" value={query} onChangeText={setQuery} clearable />
      <Input label="Pickup address" icon={MapPin} value="1458 Valencia St, San Francisco" editable={false} />
    </View>
  );
}

function Cards() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Card padding="none" onPress={() => {}} accessibilityLabel="Recology San Francisco">
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80' }}
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text variant="heading" numberOfLines={1} style={styles.flex}>
              Recology San Francisco
            </Text>
            <Text variant="bodyStrong" tabular>
              2.4 mi
            </Text>
          </View>
          <Text variant="caption" color="textSecondary">
            501 Tunnel Ave · Batteries, e-waste, paint
          </Text>
          <View style={styles.wrap}>
            <Badge label="Open now" tone="accent" dot />
            <Badge label="Free drop-off" />
          </View>
        </View>
      </Card>

      <Card variant="filled">
        <View style={styles.stackTight}>
          <Text variant="label" color="textTertiary">
            Pickup summary
          </Text>
          <View style={styles.rowBetween}>
            <Text variant="body">Couch, 3-seat</Text>
            <Text variant="body" tabular>
              $24.00
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text variant="body" color="textSecondary">
              Service fee
            </Text>
            <Text variant="body" color="textSecondary" tabular>
              $2.40
            </Text>
          </View>
          <Divider />
          <View style={styles.rowBetween}>
            <Text variant="bodyStrong">Total</Text>
            <Text variant="bodyStrong" tabular>
              $26.40
            </Text>
          </View>
        </View>
      </Card>

      <Card variant="floating">
        <View style={styles.rowCenter}>
          <Avatar name="Daniel Reyes" />
          <View style={styles.flex}>
            <Text variant="bodyStrong">Daniel is 4 min away</Text>
            <Text variant="caption" color="textSecondary">
              White Ford Transit · 8KXR214
            </Text>
          </View>
          <Button label="Call" size="sm" variant="secondary" icon={Phone} />
        </View>
      </Card>
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
            <Skeleton width="32%" height={t.space[6]} />
          </View>
        </View>
      </Card>
      <View style={styles.rowCenter}>
        <Skeleton circle height={t.layout.avatar.md} />
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
  const [selected, setSelected] = useState<string[]>(['Batteries']);
  const types = ['Batteries', 'E-waste', 'Paint', 'Textiles', 'Plastic film', 'Medications'];
  const toggle = (k: string) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  return (
    <>
      <Button
        label="Filter drop-off sites"
        variant="outline"
        icon={SlidersHorizontal}
        onPress={() => sheet.current?.present()}
      />
      <Sheet ref={sheet} title="Filter drop-off sites">
        <View style={styles.gutter}>
          <Text variant="label" color="textTertiary">
            Accepts
          </Text>
        </View>
        <View style={[styles.gutter, styles.wrap]}>
          {types.map((k) => (
            <Button
              key={k}
              size="sm"
              label={k}
              variant={selected.includes(k) ? 'secondary' : 'outline'}
              onPress={() => toggle(k)}
            />
          ))}
        </View>
        <ListRow icon={Truck} title="Offers pickup" subtitle="Sites that come to you, usually $15–$40" />
        <View style={styles.gutter}>
          <Button
            label={`Show ${12 + selected.length * 3} sites`}
            size="lg"
            fullWidth
            onPress={() => sheet.current?.dismiss()}
          />
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
