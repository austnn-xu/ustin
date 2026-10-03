import { View } from 'react-native';
import { makeStyles } from '@/theme';

/** Hairline separator. `inset` aligns it with ListRow text that has a leading element. */
export function Divider({ inset = false }: { inset?: boolean }) {
  const styles = useStyles();
  return <View style={[styles.line, inset && styles.inset]} />;
}

const useStyles = makeStyles((t) => ({
  line: { height: t.layout.hairline, backgroundColor: t.colors.border },
  inset: { marginLeft: t.layout.gutter + t.layout.avatar.md + t.space[3] },
}));
