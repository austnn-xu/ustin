import type { LucideIcon } from 'lucide-react-native';
import {
  Archive, Armchair, Backpack, Bandage, Banana, Battery, BatteryFull, BedDouble, Beer, Bike, Bone, BookOpen,
  Box, Brush, Cable, Cake, Candy, Car, Carrot, Cigarette, Circle, Coffee, Container, Cookie, CookingPot, CupSoda,
  Disc3, Droplet, Droplets, Egg, FileText, FireExtinguisher, Flame, FlaskConical, Flower2, Footprints, Frame,
  Fuel, Gamepad2, Gift, GlassWater, Glasses, Hammer, Hand, Headphones, Image, Keyboard, Laptop, Layers, Leaf,
  Lightbulb, Mail, Microwave, Milk, Newspaper, Notebook, Package, PackageOpen, PaintBucket, Paintbrush, Pencil, Pill,
  PillBottle, Pizza, Plug, Printer, Receipt, Ribbon, Sandwich, Scissors, Shirt, ShoppingBag, Smartphone, Smile,
  Snowflake, Sofa, Soup, Sparkles, SprayCan, Sprout, StickyNote, Tablet, Tag, ToyBrick, TreeDeciduous, Tv,
  Umbrella, Utensils, Volleyball, Wind, Wine, Wrench, Zap,
} from 'lucide-react-native';
import { View } from 'react-native';
import { sectionOf } from '@/lib/engine';
import { makeStyles, useTheme, type HueName } from '@/theme';

/** Each shelf's hue: unit banners, item tiles and the lesson path all agree. No two neighbours share a hue. */
export const SECTION_HUE: Record<string, HueName> = {
  drinks: 'green',
  coffee: 'brown',
  packaging: 'orange',
  kitchen: 'blue',
  organics: 'green',
  paper: 'purple',
  bathroom: 'blue',
  electronics: 'slate',
  hazardous: 'red',
  textiles: 'purple',
  house: 'orange',
};

const SECTION_ICON: Record<string, LucideIcon> = {
  drinks: CupSoda,
  coffee: Coffee,
  packaging: Package,
  kitchen: Utensils,
  organics: Leaf,
  paper: FileText,
  bathroom: Droplets,
  electronics: Plug,
  hazardous: FlaskConical,
  textiles: Shirt,
  house: Sofa,
};

/** A recognisable glyph for every catalog object, falling back to its shelf's icon. */
const OBJECT_ICON: Record<string, LucideIcon> = {
  'water-bottle': GlassWater, 'soda-bottle': CupSoda, 'milk-jug': Milk, 'milk-carton': Milk, 'juice-box': CupSoda,
  'soup-carton': Soup, 'wine-bottle': Wine, 'beer-bottle': Beer, 'drink-can': CupSoda, 'glass-jar': Container,
  'bottle-cap-plastic': Circle, 'bottle-cap-metal': Circle, 'six-pack-rings': Layers, 'drink-pouch': Droplet,
  'coffee-cup': Coffee, 'coffee-pod': Coffee, 'tea-bag': Leaf, 'coffee-grounds': Coffee,
  'pizza-box': Pizza, 'cardboard-box': Box, 'cereal-box': Box, 'egg-carton-paper': Egg, 'egg-carton-foam': Egg,
  'egg-carton-plastic': Egg, 'yogurt-cup': Container, 'butter-tub': Container, 'takeout-container': PackageOpen,
  'foam-takeout-tray': PackageOpen, 'meat-tray': PackageOpen, 'produce-bag': ShoppingBag, 'cling-film': Layers,
  'aluminium-foil': Layers, 'foil-tray': PackageOpen, 'tin-can': Soup, 'chip-bag': ShoppingBag, 'candy-wrapper': Candy,
  'bread-bag': Sandwich, 'bread-tag': Tag, 'frozen-food-bag': Snowflake, 'condiment-packet': Droplet,
  'ice-cream-tub': Container, 'squeeze-pouch': Droplet,
  'plastic-cutlery': Utensils, 'wooden-cutlery': Utensils, chopsticks: Utensils, 'paper-plate': Circle,
  'plastic-straw': CupSoda, 'paper-straw': CupSoda, 'drinking-glass': GlassWater, 'ceramic-mug': Coffee,
  'ceramic-plate': Circle, ovenware: CookingPot, 'nonstick-pan': CookingPot, 'cast-iron-pan': CookingPot,
  'metal-cutlery': Utensils, sponge: Sparkles,
  'food-scraps': Carrot, 'fruit-peel': Banana, eggshells: Egg, bones: Bone, 'cooking-oil': Droplet,
  'yard-waste': TreeDeciduous, houseplant: Sprout, 'pet-waste': Footprints, 'cat-litter': Box, 'wine-cork': Wine,
  'office-paper': FileText, newspaper: Newspaper, magazine: BookOpen, 'junk-mail': Mail, envelope: Mail,
  'window-envelope': Mail, 'padded-mailer': Mail, 'shredded-paper': Scissors, receipt: Receipt, 'sticky-notes': StickyNote,
  'greeting-card': Gift, 'gift-wrap': Gift, 'tissue-paper': Layers, 'paperback-book': BookOpen, 'spiral-notebook': Notebook,
  'laminated-paper': FileText, photograph: Image, 'cardboard-tube': Archive, pens: Pencil, crayons: Pencil, 'cd-dvd': Disc3,
  'toothpaste-tube': Smile, toothbrush: Brush, 'dental-floss': Smile, 'shampoo-bottle': Droplets, 'soap-pump': Droplets,
  'disposable-razor': Scissors, 'razor-blades': Scissors, 'cotton-swabs': Pencil, 'cotton-pads': Circle,
  'makeup-compact': Circle, 'lipstick-tube': Pencil, 'deodorant-stick': SprayCan, 'sunscreen-bottle': Droplets,
  'wet-wipes': Layers, 'sanitary-products': Package, diaper: Package, 'contact-lenses': Glasses, medication: Pill,
  'pill-bottle': PillBottle, bandages: Bandage,
  smartphone: Smartphone, laptop: Laptop, tablet: Tablet, 'charging-cable': Cable, headphones: Headphones,
  'wireless-earbuds': Headphones, battery: Battery, 'power-bank': BatteryFull, television: Tv, printer: Printer,
  'ink-cartridge': Printer, 'light-bulb': Lightbulb, 'fluorescent-tube': Lightbulb, 'smoke-detector': Wind,
  'remote-control': Gamepad2, 'keyboard-mouse': Keyboard, vape: Wind, 'small-appliance': Plug, microwave: Microwave,
  electronics: Zap,
  paint: PaintBucket, 'paint-thinner': FlaskConical, 'motor-oil': Fuel, antifreeze: Fuel, pesticide: SprayCan,
  'cleaning-spray': SprayCan, 'aerosol-can': SprayCan, 'propane-canister': Flame, lighter: Flame, matches: Flame,
  'nail-polish': Paintbrush, glue: Droplet, 'fire-extinguisher': FireExtinguisher, 'car-battery': Car, tyres: Car,
  clothing: Shirt, shoes: Footprints, 'towels-linens': Layers, pillow: BedDouble, mattress: BedDouble, backpack: Backpack,
  'stuffed-animal': Smile, carpet: Layers, umbrella: Umbrella,
  'furniture-wood': Armchair, 'wood-offcut': Hammer, mirror: Frame, 'window-glass': Frame, 'plastic-toy': ToyBrick,
  bicycle: Bike, 'plant-pot-plastic': Flower2, 'plant-pot-terracotta': Flower2, 'coat-hanger-wire': Shirt,
  'coat-hanger-plastic': Shirt, eyeglasses: Glasses, 'bubble-wrap': Package, 'packing-peanuts': Package,
  'packing-tape': Ribbon, 'rubber-gloves': Hand, 'scrap-metal': Wrench, 'brick-rubble': Hammer, 'christmas-lights': Lightbulb,
  'garden-hose': Droplets, 'vacuum-bag': Wind, 'desiccant-packet': Package, balloon: Cake, 'cigarette-butt': Cigarette,
  'chewing-gum': Cookie, 'pet-food-bag': ShoppingBag, 'sports-equipment': Volleyball,
};

export const iconForObject = (objectId: string): LucideIcon =>
  OBJECT_ICON[objectId] ?? SECTION_ICON[sectionOf(objectId)] ?? Package;

export const hueForObject = (objectId: string): HueName => SECTION_HUE[sectionOf(objectId)] ?? 'slate';

export const iconForSection = (sectionId: string): LucideIcon => SECTION_ICON[sectionId] ?? Package;

/** The item's picture: its glyph on a tile in its shelf's hue. */
export function ItemArt({ objectId, size = 'md' }: { objectId: string; size?: 'sm' | 'md' | 'lg' }) {
  const t = useTheme();
  const styles = useStyles();
  const hue = t.colors.hue[hueForObject(objectId)];
  const Glyph = iconForObject(objectId);
  const px = t.layout.art[size];
  return (
    <View
      style={[styles.tile, { width: px, height: px, backgroundColor: hue.subtle, borderColor: hue.base }]}
      aria-hidden
    >
      <Glyph size={px * 0.5} color={hue.base} strokeWidth={t.layout.iconStroke} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  tile: {
    borderRadius: t.radius.lg,
    borderWidth: t.layout.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
