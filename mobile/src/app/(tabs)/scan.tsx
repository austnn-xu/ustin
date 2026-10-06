import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, ImageUp, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ItemArt } from '@/components/art/ItemArt';
import { MascotSays } from '@/components/MascotSays';
import { Button, Card, Divider, Icon, Input, ListRow, PressableScale, ProgressBar, Screen, Text } from '@/components/ui';
import { rules, type CatalogObject } from '@/lib/engine';
import { useRecognition, type Recognition } from '@/lib/recognize';
import { useProgress } from '@/stores/progress';
import { makeStyles, useTheme } from '@/theme';

/** Things people most often get wrong, as one-tap starting points. */
const POPULAR = ['coffee-cup', 'pizza-box', 'battery', 'produce-bag', 'takeout-container', 'light-bulb', 'smartphone', 'clothing'];

const openItem = (id: string) => router.push({ pathname: '/item/[id]', params: { id } });

export default function WhatBin() {
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const { state, pick, reset, supported } = useRecognition();
  const sorted = useProgress((s) => s.sorted);
  const results = useMemo(() => (query.trim() ? rules.search(query, 12) : []), [query]);
  const recent = useMemo(
    () =>
      Object.entries(sorted)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => rules.findObject(id))
        .filter((o): o is CatalogObject => !!o),
    [sorted],
  );

  return (
    <Screen gutter={false} keyboard>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <Text variant="display">What bin?</Text>

          {state.phase === 'idle' ? (
            <MascotSays mood="happy" size="sm">
              Tell me what you are throwing away and I will tell you where every part goes.
            </MascotSays>
          ) : (
            <PhotoResult state={state} onReset={reset} />
          )}

          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${rules.OBJECTS.length} items: "pizza box", "battery"…`}
            icon={Search}
            clearable
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={() => results[0] && openItem(results[0].id)}
          />

          {supported && !query && state.phase === 'idle' && (
            <View style={styles.photoRow}>
              <View style={styles.flex}>
                <Button label="Camera" icon={Camera} variant="secondary" fullWidth onPress={() => pick('camera')} />
              </View>
              <View style={styles.flex}>
                <Button label="Upload" icon={ImageUp} variant="neutral" fullWidth onPress={() => pick('library')} />
              </View>
            </View>
          )}
        </View>

        {query.trim() ? (
          <View>
            {results.length === 0 ? (
              <View style={styles.column}>
                <Card style={styles.gap}>
                  <Text variant="bodyStrong">{`Nothing called "${query.trim()}" yet`}</Text>
                  <Text variant="body" color="textSecondary">
                    Try a simpler word, like the material: plastic, glass, paper, metal. Or browse by shelf in the Learn tab guidebooks.
                  </Text>
                </Card>
              </View>
            ) : (
              results.map((o, i) => (
                <View key={o.id}>
                  {i > 0 && <Divider inset />}
                  <ListRow title={o.label} subtitle={o.components.map((c) => c.material).join(' · ')} leading={<ItemArt objectId={o.id} size="sm" />} onPress={() => openItem(o.id)} />
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.column}>
            {recent.length > 0 && (
              <>
                <Text variant="label" color="textSecondary">
                  Recently sorted
                </Text>
                <View style={styles.tiles}>
                  {recent.map((o) => (
                    <ItemTile key={o.id} object={o} />
                  ))}
                </View>
              </>
            )}
            <Text variant="label" color="textSecondary">
              People often get these wrong
            </Text>
            <View style={styles.tiles}>
              {POPULAR.map((id) => rules.findObject(id))
                .filter((o): o is CatalogObject => !!o)
                .map((o) => (
                  <ItemTile key={o.id} object={o} />
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function ItemTile({ object }: { object: CatalogObject }) {
  const styles = useStyles();
  return (
    <PressableScale onPress={() => openItem(object.id)} accessibilityLabel={object.label} style={styles.tile}>
      <ItemArt objectId={object.id} size="md" />
      <Text variant="callout" align="center" numberOfLines={2}>
        {object.label}
      </Text>
    </PressableScale>
  );
}

function PhotoResult({ state, onReset }: { state: Exclude<Recognition, { phase: 'idle' }>; onReset: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const uri = state.uri;

  let body: React.ReactNode;
  if (state.phase === 'loading') {
    body = (
      <View style={styles.gap}>
        <MascotSays mood="thinking" size="sm">
          {state.progress < 1 ? 'Warming up my eyes… this only takes a while the first time.' : 'Almost ready…'}
        </MascotSays>
        <View style={styles.progressRow}>
          <ProgressBar value={state.progress} hue="blue" accessibilityLabel="Downloading the recognition model" />
          <Text variant="callout" color="textSecondary" tabular>{`${Math.round(state.progress * 100)}%`}</Text>
        </View>
      </View>
    );
  } else if (state.phase === 'thinking') {
    body = (
      <MascotSays mood="thinking" size="sm">
        Hmm, let me look at this…
      </MascotSays>
    );
  } else if (state.phase === 'error') {
    body = (
      <MascotSays mood="sad" size="sm">
        {state.message}
      </MascotSays>
    );
  } else {
    const { result, narrowed } = state;
    const best = result.candidates[0];
    if (result.recognized && best) {
      const others = result.candidates.slice(1, 4);
      body = (
        <View style={styles.gap}>
          <MascotSays mood="wow" size="sm">
            {`That looks like a ${best.object.label.toLowerCase()}!`}
          </MascotSays>
          <Button label="Yes, that's it" fullWidth onPress={() => openItem(best.object.id)} />
          {others.length > 0 && (
            <>
              <Text variant="label" color="textSecondary">
                Or is it one of these?
              </Text>
              {others.map((c) => (
                <ListRow key={c.object.id} title={c.object.label} leading={<ItemArt objectId={c.object.id} size="sm" />} onPress={() => openItem(c.object.id)} />
              ))}
            </>
          )}
        </View>
      );
    } else if (narrowed && narrowed.objects.length > 0) {
      body = (
        <View style={styles.gap}>
          <MascotSays mood="thinking" size="sm">
            {`I can't tell exactly what it is, but it looks like ${narrowed.material.id}. Which one is it?`}
          </MascotSays>
          {narrowed.objects.map((o) => (
            <ListRow key={o.id} title={o.label} leading={<ItemArt objectId={o.id} size="sm" />} onPress={() => openItem(o.id)} />
          ))}
        </View>
      );
    } else {
      body = (
        <MascotSays mood="worried" size="sm">
          {result.looksLikeWaste
            ? "Hmm, I don't recognise that one. Try searching for it below."
            : `That looks like a ${result.saw.label}, not something you'd throw away. Search for your item below.`}
        </MascotSays>
      );
    }
  }

  return (
    <Card padding="md" style={styles.gap}>
      <View style={styles.photoHead}>
        {uri && <Image source={{ uri }} style={styles.photo} contentFit="cover" accessibilityLabel="Your photo" />}
        <View style={styles.flex} />
        <PressableScale onPress={onReset} accessibilityLabel="Clear photo" hitSlop={t.space[2]}>
          <Icon icon={X} color="textTertiary" />
        </PressableScale>
      </View>
      {body}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingTop: t.space[4], paddingBottom: t.space[16], gap: t.space[4] },
  column: { width: '100%', maxWidth: t.layout.maxWidth, alignSelf: 'center', paddingHorizontal: t.layout.gutter, gap: t.space[4] },
  flex: { flex: 1 },
  gap: { gap: t.space[3] },
  photoRow: { flexDirection: 'row', gap: t.space[3] },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] },
  tile: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: t.space[2],
    padding: t.space[3],
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    borderColor: t.colors.border,
    borderBottomWidth: t.layout.depth.md,
  },
  photoHead: { flexDirection: 'row', alignItems: 'flex-start' },
  photo: { width: t.space[20] + t.space[4], height: t.space[20] + t.space[4], borderRadius: t.radius.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3] },
}));
