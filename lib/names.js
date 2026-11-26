'use strict';

/**
 * US Tin — leaderboard names.
 *
 * Nobody types a name. A player rolls one: three words, family-friendly, like "Happy Mossy Otter" or
 * "Dancing Peppermint Lighthouse". Every word comes from the lists below, so no one can put anything else on the
 * board: the database (`supabase/migrations/20261126000000_rolled_names.sql`, generated from this file by
 * `supabase/gen-names-migration.js`) holds the same lists and refuses any other name.
 *
 * The lists are hand-picked: gentle words only (nothing about bodies, violence, drink, drugs, insults or politics),
 * nine letters or fewer so the longest name is 29 characters, and no word appears twice anywhere, so a name always
 * reads in the same order. A test fails if a list shrinks below 500 words, if a word is repeated, or if a name could
 * spell a word on the blocklist. Changing a list means regenerating the migration; the test checks that too.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.USTinNames = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /** How you feel or what you are like (and, in the middle, what you are doing or made of). */
  const FIRST = [
    'Able', 'Abundant', 'Ace', 'Active', 'Adaptable', 'Adept', 'Adored', 'Affable', 'Agile', 'Alert', 'Alpha',
    'Amazed', 'Ambitious', 'Amicable', 'Amused', 'Ancient', 'Angelic', 'Animated', 'Appealing', 'Apt', 'Ardent',
    'Artful', 'Assured', 'Astute', 'Atomic', 'Attentive', 'Authentic', 'Avid', 'Awake', 'Aware', 'Awesome',
    'Balanced', 'Bashful', 'Beloved', 'Beta', 'Blessed', 'Blissful', 'Blithe', 'Bold', 'Bonny', 'Boundless',
    'Brainy', 'Brave', 'Brawny', 'Bright', 'Brilliant', 'Brisk', 'Buoyant', 'Busy', 'Buzzy', 'Calm', 'Candid',
    'Capable', 'Carefree', 'Careful', 'Caring', 'Casual', 'Charming', 'Chatty', 'Cheeky', 'Cheerful', 'Cheery',
    'Cheesy', 'Cherished', 'Chic', 'Chipper', 'Chirpy', 'Chosen', 'Chummy', 'Classic', 'Clean', 'Clear', 'Clever',
    'Cogent', 'Colossal', 'Comfy', 'Compact', 'Composed', 'Confident', 'Content', 'Convivial', 'Cool', 'Cordial',
    'Corny', 'Cosmic', 'Courteous', 'Cozy', 'Crafty', 'Creative', 'Crisp', 'Cuddly', 'Curious', 'Cute', 'Dandy',
    'Dapper', 'Dauntless', 'Dazzled', 'Dear', 'Decent', 'Decisive', 'Deft', 'Delighted', 'Devoted', 'Digital',
    'Diligent', 'Discreet', 'Distinct', 'Dizzy', 'Dreamy', 'Droll', 'Dutiful', 'Dynamic', 'Eager', 'Earnest', 'Easy',
    'Ebullient', 'Effusive', 'Elastic', 'Elated', 'Electric', 'Elegant', 'Eloquent', 'Empathic', 'Enchanted',
    'Endless', 'Energetic', 'Enlivened', 'Enthused', 'Epic', 'Equal', 'Essential', 'Eternal', 'Everyday', 'Exact',
    'Exalted', 'Excited', 'Exemplary', 'Expert', 'Exuberant', 'Fabled', 'Fabulous', 'Fair', 'Faithful', 'Famous',
    'Fancy', 'Fantastic', 'Fearless', 'Fervent', 'Festive', 'Fierce', 'Fiery', 'Fine', 'Firm', 'Fit', 'Flashy',
    'Flawless', 'Fleet', 'Fluent', 'Fluffy', 'Focused', 'Fond', 'Fortunate', 'Forward', 'Frank', 'Free', 'Fresh',
    'Friendly', 'Frisky', 'Fruitful', 'Fun', 'Funky', 'Funny', 'Fuzzy', 'Gainful', 'Galactic', 'Gallant', 'Generous',
    'Genial', 'Gentle', 'Genuine', 'Giant', 'Giddy', 'Gifted', 'Giga', 'Gigantic', 'Giggly', 'Glad', 'Gladsome',
    'Glamorous', 'Gleeful', 'Glorious', 'Glowing', 'Good', 'Goofy', 'Graceful', 'Gracious', 'Grand', 'Grateful',
    'Great', 'Groovy', 'Grounded', 'Gutsy', 'Hale', 'Handy', 'Happy', 'Hardy', 'Harmless', 'Heartfelt', 'Hearty',
    'Helpful', 'Heroic', 'Hilarious', 'Hip', 'Homey', 'Honest', 'Honored', 'Hopeful', 'Humble', 'Hyper', 'Ideal',
    'Idyllic', 'Imaginary', 'Immense', 'Impish', 'Incisive', 'Ingenious', 'Innocent', 'Inspired', 'Intrepid',
    'Intuitive', 'Inventive', 'Jaunty', 'Jazz', 'Jazzy', 'Jiggly', 'Jocund', 'Jolly', 'Jovial', 'Joyful', 'Jubilant',
    'Judicious', 'Jumbo', 'Jumpy', 'Just', 'Keen', 'Kind', 'Kindly', 'Kooky', 'Large', 'Lazy', 'Lean', 'Level',
    'Light', 'Likable', 'Likeable', 'Limber', 'Little', 'Lively', 'Lofty', 'Long', 'Loopy', 'Lovable', 'Lovely',
    'Loyal', 'Lucid', 'Lucky', 'Lunar', 'Lush', 'Lyrical', 'Magic', 'Magical', 'Majestic', 'Marvelous', 'Massive',
    'Max', 'Maxi', 'Mega', 'Mellow', 'Melodic', 'Mended', 'Merciful', 'Merry', 'Micro', 'Mighty', 'Mindful', 'Mini',
    'Mirthful', 'Modern', 'Modest', 'Mystic', 'Nano', 'Narrow', 'Natural', 'Neat', 'Neo', 'Nifty', 'Nimble', 'Noble',
    'Normal', 'Notable', 'Novel', 'Observant', 'Omni', 'Open', 'Optimal', 'Opulent', 'Orderly', 'Original',
    'Pacific', 'Painless', 'Patched', 'Patient', 'Peaceful', 'Peerless', 'Peppery', 'Peppy', 'Perfect', 'Perky',
    'Petite', 'Pippy', 'Placid', 'Playful', 'Pleasant', 'Plucky', 'Plush', 'Poised', 'Polished', 'Polite', 'Popular',
    'Positive', 'Powerful', 'Practical', 'Precious', 'Pretty', 'Priceless', 'Prime', 'Prized', 'Profound', 'Prompt',
    'Proper', 'Proud', 'Punctual', 'Pure', 'Quaint', 'Quick', 'Quiet', 'Quirky', 'Quizzical', 'Radiant', 'Rapid',
    'Ready', 'Real', 'Reassured', 'Receptive', 'Refilled', 'Refined', 'Refreshed', 'Regal', 'Relaxed', 'Reliable',
    'Renewed', 'Repaired', 'Resilient', 'Resolute', 'Respected', 'Rested', 'Restful', 'Restored', 'Retro', 'Reused',
    'Rich', 'Right', 'Righteous', 'Robust', 'Romantic', 'Roomy', 'Round', 'Rowdy', 'Royal', 'Rugged', 'Rustic',
    'Safe', 'Sagacious', 'Sassy', 'Satisfied', 'Savvy', 'Scenic', 'Scholarly', 'Seasoned', 'Secure', 'Selfless',
    'Sensible', 'Sensitive', 'Serene', 'Settled', 'Shiny', 'Short', 'Shrewd', 'Shy', 'Silly', 'Simple', 'Sincere',
    'Skilled', 'Sleek', 'Sleepy', 'Slick', 'Smart', 'Smiley', 'Smooth', 'Snappy', 'Snazzy', 'Snug', 'Snuggly',
    'Sociable', 'Social', 'Solid', 'Sparkly', 'Sparky', 'Special', 'Speedy', 'Spiffy', 'Spirited', 'Splendid',
    'Sporty', 'Sprightly', 'Spry', 'Spunky', 'Square', 'Squeaky', 'Squishy', 'Stable', 'Stalwart', 'Steadfast',
    'Steady', 'Stellar', 'Stitched', 'Stout', 'Studious', 'Stylish', 'Suave', 'Subtle', 'Succinct', 'Sunny', 'Super',
    'Superb', 'Supreme', 'Sure', 'Swell', 'Swift', 'Tactful', 'Tall', 'Tame', 'Tasty', 'Teensy', 'Tenacious',
    'Tender', 'Terrific', 'Thankful', 'Thorough', 'Thrifty', 'Thrilled', 'Thriving', 'Tickled', 'Tidy', 'Timely',
    'Tiny', 'Toasted', 'Tolerant', 'Top', 'Topnotch', 'Total', 'Tough', 'Tranquil', 'Treasured', 'Trendy', 'Trim',
    'True', 'Trustful', 'Trusty', 'Truthful', 'Turbo', 'Twinkly', 'Ultra', 'Unafraid', 'Unbeaten', 'Unbridled',
    'Undaunted', 'Unfazed', 'Unified', 'Unique', 'United', 'Unselfish', 'Upbeat', 'Uplifted', 'Upright', 'Urbane',
    'Useful', 'Valiant', 'Valorous', 'Valued', 'Vast', 'Venerable', 'Versatile', 'Vibrant', 'Vigilant', 'Vigorous',
    'Virtuous', 'Visionary', 'Vital', 'Vivacious', 'Vivid', 'Vocal', 'Voluble', 'Wacky', 'Wakeful', 'Warm',
    'Watchful', 'Wavy', 'Wee', 'Welcome', 'Whole', 'Wholesome', 'Wide', 'Wiggly', 'Wild', 'Willing', 'Willowy',
    'Winning', 'Winsome', 'Wired', 'Wise', 'Wishful', 'Witty', 'Wizardly', 'Wobbly', 'Wonderful', 'Wondrous',
    'Worthy', 'Young', 'Youthful', 'Yummy', 'Zany', 'Zealous', 'Zen', 'Zestful', 'Zesty', 'Zigzag', 'Zippy',
  ];

  /** Colours, materials, weather, textures, flavours and actions: the middle word. */
  const MIDDLE = [
    'Accepting', 'Airborne', 'Alluring', 'Almond', 'Alpine', 'Ambient', 'Angular', 'Apple', 'Aqua', 'Aquatic',
    'Arched', 'Arctic', 'Aromatic', 'Ashen', 'Aspen', 'Aubergine', 'Auburn', 'Autumn', 'Azure', 'Baking', 'Banana',
    'Barley', 'Basil', 'Basking', 'Beaded', 'Beaming', 'Bean', 'Beet', 'Beige', 'Biking', 'Billowy', 'Birch',
    'Biscuit', 'Bisque', 'Blond', 'Blooming', 'Blossom', 'Blue', 'Bluebell', 'Blush', 'Blustery', 'Bobbing',
    'Bordeaux', 'Bouncing', 'Bouncy', 'Braided', 'Branchy', 'Brass', 'Breezy', 'Brick', 'Bronze', 'Brook', 'Brown',
    'Bubbly', 'Buff', 'Building', 'Bumpy', 'Burgundy', 'Bustling', 'Butter', 'Buttercup', 'Buttery', 'Buzzing',
    'Cabbage', 'Camping', 'Candy', 'Canvas', 'Cardboard', 'Carmine', 'Cascading', 'Cashew', 'Cedar', 'Celery',
    'Ceramic', 'Cerise', 'Cerulean', 'Chalky', 'Charcoal', 'Checkered', 'Cheddar', 'Cheering', 'Chestnut', 'Chewy',
    'Chili', 'Chirping', 'Chocolate', 'Chowder', 'Chrome', 'Chuckling', 'Cinnamon', 'Circular', 'Citron', 'Citrus',
    'Clapping', 'Claret', 'Clay', 'Climbing', 'Cloudlike', 'Cloudy', 'Clover', 'Coastal', 'Cobalt', 'Coiled',
    'Colorful', 'Concrete', 'Cooking', 'Copper', 'Cork', 'Cotton', 'Counting', 'Crafting', 'Cream', 'Creamy',
    'Crescent', 'Crimson', 'Crinkly', 'Crispy', 'Crumbly', 'Crunchy', 'Cuddling', 'Curly', 'Currant', 'Curvy',
    'Custard', 'Cyan', 'Dainty', 'Dancing', 'Dandelion', 'Dappled', 'Daring', 'Darting', 'Dashing', 'Dawn',
    'Dazzling', 'Denim', 'Desert', 'Dewdrop', 'Dewy', 'Dill', 'Diving', 'Dotted', 'Dotty', 'Draped', 'Drawing',
    'Dreaming', 'Dreamlike', 'Drifting', 'Drizzly', 'Droplet', 'Dusky', 'Dusty', 'Earthy', 'Ebony', 'Eclair',
    'Eggshell', 'Ember', 'Emerald', 'Enduring', 'Engaging', 'Ethereal', 'Evergreen', 'Exploring', 'Feathery', 'Felt',
    'Fennel', 'Fernlike', 'Fetching', 'Fig', 'Fizzy', 'Flaky', 'Flashing', 'Flax', 'Fleece', 'Flint', 'Floating',
    'Floral', 'Flour', 'Flowery', 'Flowing', 'Fluttery', 'Foamy', 'Foggy', 'Fondue', 'Forested', 'Freckled',
    'Frilly', 'Fringed', 'Frosted', 'Frosty', 'Frozen', 'Fruity', 'Fuchsia', 'Furry', 'Galloping', 'Gardening',
    'Garlic', 'Gelato', 'Giggling', 'Gilded', 'Ginger', 'Glacial', 'Glass', 'Glassy', 'Glazed', 'Gleaming',
    'Gliding', 'Glimmery', 'Glossy', 'Golden', 'Goldenrod', 'Gourd', 'Grainy', 'Granite', 'Granola', 'Grape',
    'Grassy', 'Gravel', 'Gray', 'Green', 'Greeting', 'Grinning', 'Gritty', 'Growing', 'Guava', 'Guiding', 'Gunmetal',
    'Gusty', 'Hairy', 'Harlequin', 'Hatching', 'Hazel', 'Hazelnut', 'Hazy', 'Heather', 'Helping', 'Hexagon',
    'Hickory', 'Hiking', 'Hilly', 'Hollow', 'Honey', 'Honeydew', 'Honeyed', 'Hooked', 'Hopping', 'Hugging', 'Humid',
    'Humming', 'Hummus', 'Icy', 'Imagining', 'Indigo', 'Inky', 'Inventing', 'Inviting', 'Iron', 'Ivory', 'Jagged',
    'Jam', 'Jasper', 'Jelly', 'Jet', 'Juggling', 'Jumping', 'Juniper', 'Kale', 'Kayaking', 'Khaki', 'Knitted',
    'Knitting', 'Knotty', 'Knowing', 'Kumquat', 'Lakeside', 'Lapis', 'Lasting', 'Latte', 'Laughing', 'Lavender',
    'Layered', 'Leafed', 'Leafy', 'Leaping', 'Learning', 'Leather', 'Leek', 'Lemony', 'Licorice', 'Lilac', 'Lime',
    'Lined', 'Linen', 'Lollipop', 'Looped', 'Lounging', 'Luminous', 'Lumpy', 'Magenta', 'Mahogany', 'Mallow',
    'Marbled', 'Marching', 'Marmalade', 'Maroon', 'Mashed', 'Mauve', 'Meringue', 'Metal', 'Midnight', 'Mild', 'Mint',
    'Minty', 'Mirrored', 'Misty', 'Mocha', 'Moonlit', 'Mossy', 'Mottled', 'Mountain', 'Muddy', 'Mulberry',
    'Munching', 'Mushy', 'Mustard', 'Muted', 'Napping', 'Navy', 'Nectar', 'Nested', 'Nibbling', 'Notched', 'Nubby',
    'Nurturing', 'Nutmeg', 'Nutty', 'Oatcake', 'Oatmeal', 'Oaty', 'Obliging', 'Oblong', 'Oceanic', 'Ochre', 'Okra',
    'Olive', 'Onyx', 'Orange', 'Outgoing', 'Oval', 'Paddling', 'Painted', 'Painting', 'Paper', 'Paprika', 'Parsley',
    'Pasta', 'Pastel', 'Patchy', 'Patterned', 'Peachy', 'Peanut', 'Pearly', 'Pebbly', 'Pecan', 'Pewter', 'Pickled',
    'Pie', 'Pillowy', 'Pink', 'Pistachio', 'Pita', 'Pizza', 'Plaid', 'Planting', 'Plastic', 'Platinum', 'Pleated',
    'Pointy', 'Polar', 'Polka', 'Pomelo', 'Popcorn', 'Powder', 'Prancing', 'Prickly', 'Primrose', 'Prismatic',
    'Puffy', 'Purple', 'Purring', 'Quilted', 'Quince', 'Racing', 'Rainy', 'Raisin', 'Raspberry', 'Ravioli',
    'Reading', 'Recycled', 'Recycling', 'Red', 'Redwood', 'Relaxing', 'Resting', 'Reusable', 'Reusing', 'Rewarding',
    'Rhubarb', 'Rice', 'Rippled', 'Roaming', 'Rocky', 'Rolling', 'Rose', 'Rosy', 'Rowing', 'Rubber', 'Rubbery',
    'Ruffled', 'Rural', 'Russet', 'Rusty', 'Rye', 'Saffron', 'Sage', 'Sailing', 'Salsa', 'Salty', 'Sandstone',
    'Sandy', 'Satiny', 'Scalloped', 'Scaly', 'Scarlet', 'Scurrying', 'Seaside', 'Sepia', 'Sesame', 'Shaded', 'Shady',
    'Shaggy', 'Sharing', 'Sheer', 'Shelled', 'Sherbet', 'Shimmery', 'Shining', 'Sienna', 'Silken', 'Silky', 'Silver',
    'Singing', 'Sipping', 'Skating', 'Sketching', 'Skiing', 'Skipping', 'Sky', 'Skyward', 'Slate', 'Sledding',
    'Sleeky', 'Sleety', 'Slippery', 'Smiling', 'Smoke', 'Smoky', 'Snacking', 'Snoozing', 'Snow', 'Snowy', 'Soaring',
    'Soft', 'Solar', 'Soothing', 'Sooty', 'Sorbet', 'Sorting', 'Sourdough', 'Soy', 'Sparkling', 'Spinning',
    'Spiral', 'Splashing', 'Splotchy', 'Spongy', 'Spotted', 'Spring', 'Springy', 'Sprinkled', 'Sprouting', 'Spruce',
    'Squash', 'Squashy', 'Squiggly', 'Starlit', 'Starry', 'Steel', 'Steely', 'Sterling', 'Sticky', 'Stirring',
    'Stormy', 'Strapping', 'Straw', 'Streaked', 'Striped', 'Stripy', 'Strolling', 'Strudel', 'Studded', 'Stunning',
    'Sugary', 'Summer', 'Sundae', 'Sunlit', 'Sunset', 'Surfing', 'Sushi', 'Swimming', 'Swirling', 'Swirly',
    'Swooping', 'Taco', 'Tan', 'Tangled', 'Tangy', 'Tapered', 'Tart', 'Tasseled', 'Taupe', 'Tawny', 'Tea', 'Teal',
    'Teeming', 'Textured', 'Thinking', 'Thistle', 'Tidal', 'Tiered', 'Tilted', 'Timber', 'Tin', 'Tinkering',
    'Toasty', 'Tomato', 'Topsy', 'Triangle', 'Tropic', 'Tropical', 'Trotting', 'Trusting', 'Trying', 'Tufted',
    'Tumbling', 'Turquoise', 'Tweeting', 'Twilight', 'Twinkling', 'Twirling', 'Twirly', 'Twisted', 'Umber',
    'Upcycled', 'Vanilla', 'Vaulted', 'Veined', 'Velvet', 'Velvety', 'Vermilion', 'Violet', 'Waddling', 'Walnut',
    'Wandering', 'Watery', 'Waving', 'Waxy', 'Weathered', 'Weaving', 'Webbed', 'Welcoming', 'Wheat', 'Whirling',
    'Whistling', 'White', 'Whizzing', 'Wicker', 'Windy', 'Winged', 'Winking', 'Winter', 'Wispy', 'Wisteria',
    'Wondering', 'Wooded', 'Wooden', 'Woodland', 'Wool', 'Woolly', 'Wooly', 'Woven', 'Wrinkly', 'Writing', 'Yam',
    'Yarn', 'Yawning', 'Yearning', 'Yellow', 'Yogurt', 'Zigzagged', 'Zinc', 'Zippered', 'Zipping', 'Zooming',
    'Zucchini',
  ];

  /** What you are: animals, plants and fun things. */
  const LAST = [
    'Aardvark', 'Accordion', 'Acorn', 'Albatross', 'Alligator', 'Aloe', 'Alpaca', 'Amber', 'Anchor', 'Anteater',
    'Antelope', 'Anthem', 'Antlion', 'Apricot', 'Apron', 'Armadillo', 'Aster', 'Auklet', 'Aurora', 'Avocet',
    'Axolotl', 'Backpack', 'Badge', 'Badger', 'Bagel', 'Bagpipe', 'Ballad', 'Balloon', 'Bamboo', 'Banjo', 'Banner',
    'Bard', 'Barn', 'Barnacle', 'Barracuda', 'Barrel', 'Basilisk', 'Basket', 'Bassoon', 'Beacon', 'Beanie',
    'Beanstalk', 'Bear', 'Bee', 'Beetle', 'Bell', 'Berry', 'Biker', 'Biscotti', 'Bison', 'Bittern', 'Blanket',
    'Blender', 'Blueberry', 'Bluebird', 'Bluejay', 'Bobcat', 'Bobolink', 'Bongo', 'Bonsai', 'Boomerang', 'Boot',
    'Bottle', 'Bottlecap', 'Boulder', 'Bramble', 'Branch', 'Breeze', 'Bridge', 'Brownie', 'Bubble', 'Bucket', 'Bud',
    'Buffalo', 'Bugle', 'Builder', 'Bullfrog', 'Bumblebee', 'Bunny', 'Bunting', 'Butterfly', 'Button',
    'Cabin', 'Cactus', 'Calf', 'Camel', 'Camper', 'Campfire', 'Can', 'Canary', 'Candle', 'Cannoli', 'Canoe',
    'Canyon', 'Cape', 'Captain', 'Capybara', 'Caracal', 'Caramel', 'Cardinal', 'Caribou', 'Carrot', 'Carton',
    'Cassowary', 'Castle', 'Cat', 'Catfish', 'Cavern', 'Cello', 'Chaffinch', 'Chameleon', 'Cheetah', 'Cherry',
    'Chick', 'Chickadee', 'Chime', 'Chipmunk', 'Chorus', 'Chukar', 'Churro', 'Cicada', 'Civet', 'Clam', 'Clarinet',
    'Cliff', 'Climber', 'Clock', 'Cloud', 'Coati', 'Coconut', 'Cocoon', 'Cod', 'Collage', 'Colobus',
    'Comet', 'Compass', 'Composter', 'Condor', 'Cone', 'Cookie', 'Coral', 'Cormorant', 'Cosmos', 'Cottage', 'Cougar',
    'Cove', 'Cow', 'Coyote', 'Crab', 'Cracker', 'Cranberry', 'Crane', 'Crate', 'Crayon', 'Creek', 'Cricket', 'Crow',
    'Crown', 'Crumpet', 'Crystal', 'Cub', 'Cuckoo', 'Cupcake', 'Curlew', 'Cushion', 'Cygnet', 'Cymbal', 'Daisy',
    'Damselfly', 'Dancer', 'Daydream', 'Deer', 'Diamond', 'Dingo', 'Dinosaur', 'Dipper', 'Diver', 'Dolphin',
    'Donkey', 'Donut', 'Doodle', 'Dormouse', 'Dove', 'Dragon', 'Dragonfly', 'Dreamer', 'Drum', 'Drummer', 'Duck',
    'Duckling', 'Dugong', 'Dumpling', 'Dune', 'Dunlin', 'Eagle', 'Eclipse', 'Eel', 'Egret', 'Eider', 'Eland',
    'Elephant', 'Elf', 'Elk', 'Emu', 'Envelope', 'Eraser', 'Ermine', 'Explorer', 'Fable', 'Fairy', 'Falcon', 'Fawn',
    'Feather', 'Fern', 'Ferret', 'Ferry', 'Fiddle', 'Finch', 'Firefly', 'Flag', 'Flamingo', 'Fledgling', 'Flounder',
    'Flower', 'Flute', 'Flyer', 'Foal', 'Forest', 'Fossa', 'Fossil', 'Fountain', 'Fox', 'Frog', 'Fudge', 'Fulmar',
    'Gadget', 'Galaxy', 'Gannet', 'Garden', 'Gardener', 'Garfish', 'Garnet', 'Gazelle', 'Gecko', 'Genet', 'Geode',
    'Gerbil', 'Geyser', 'Gharial', 'Gibbon', 'Giraffe', 'Gizmo', 'Glacier', 'Glider', 'Gnome', 'Gnu', 'Goat',
    'Goggles', 'Goldfinch', 'Goldfish', 'Gong', 'Goose', 'Gopher', 'Gorilla', 'Gosling', 'Grebe',
    'Greyhound', 'Griffin', 'Grizzly', 'Grosbeak', 'Grouse', 'Grove', 'Guitar', 'Gull', 'Guppy', 'Haddock', 'Haiku',
    'Halibut', 'Hammock', 'Hamster', 'Harbor', 'Hare', 'Harmony', 'Harp', 'Harrier', 'Harvest', 'Hatchling', 'Hawk',
    'Hedgehog', 'Helmet', 'Heron', 'Hiker', 'Hill', 'Hippo', 'Hornbill', 'Horse', 'Hoverfly', 'Husky', 'Hyrax',
    'Ibex', 'Ibis', 'Icicle', 'Iguana', 'Impala', 'Iris', 'Island', 'Ivy', 'Jackal', 'Jade', 'Jaguar', 'Jar', 'Jay',
    'Jellyfish', 'Jerboa', 'Jester', 'Jingle', 'Joey', 'Journey', 'Juggler', 'Jumper', 'Junco', 'Jungle', 'Kangaroo',
    'Katydid', 'Kayak', 'Kazoo', 'Kelp', 'Kestrel', 'Kettle', 'Kinglet', 'Kinkajou', 'Kite', 'Kitten', 'Kittiwake',
    'Kiwi', 'Knight', 'Koala', 'Koi', 'Krill', 'Ladle', 'Ladybug', 'Lagoon', 'Lake', 'Lamb', 'Lamp', 'Lamppost',
    'Langur', 'Lantern', 'Lapwing', 'Lark', 'Leaf', 'Legend', 'Lemming', 'Lemon', 'Lemur', 'Lens', 'Leopard',
    'Leveret', 'Lily', 'Limpet', 'Linnet', 'Lion', 'Lizard', 'Llama', 'Lobster', 'Locust', 'Loon', 'Lotus',
    'Lullaby', 'Lynx', 'Macaw', 'Mackerel', 'Magnet', 'Magpie', 'Maker', 'Mallard', 'Mammoth', 'Manatee', 'Mandolin',
    'Mango', 'Mantis', 'Maple', 'Maracas', 'Marble', 'Margay', 'Marlin', 'Marmot', 'Marsh', 'Marzipan', 'Mastodon',
    'Meadow', 'Medal', 'Meerkat', 'Melody', 'Melon', 'Merganser', 'Mermaid', 'Mesa', 'Meteor', 'Minnow', 'Mitten',
    'Mole', 'Mongoose', 'Monkey', 'Moon', 'Moonbeam', 'Moose', 'Mosaic', 'Moss', 'Moth', 'Mouse', 'Muffin', 'Mug',
    'Mule', 'Mural', 'Mushroom', 'Muskrat', 'Mystery', 'Napkin', 'Narwhal', 'Nebula', 'Newt', 'Nightjar', 'Noodle',
    'Notebook', 'Nougat', 'Nugget', 'Numbat', 'Nuthatch', 'Oak', 'Oar', 'Oasis', 'Oboe', 'Ocarina', 'Ocelot',
    'Octopus', 'Odyssey', 'Okapi', 'Opal', 'Opossum', 'Orbit', 'Orca', 'Orchard', 'Orchid', 'Origami', 'Oriole',
    'Oryx', 'Osprey', 'Ostrich', 'Otter', 'Owl', 'Oyster', 'Package', 'Painter', 'Pancake', 'Panda', 'Pangolin',
    'Panther', 'Papaya', 'Parakeet', 'Parcel', 'Parrot', 'Partridge', 'Peach', 'Peacock', 'Pear', 'Pearl', 'Pebble',
    'Pedal', 'Pelican', 'Pencil', 'Penguin', 'Pennant', 'Pepper', 'Perch', 'Petal', 'Petrel', 'Pheasant', 'Phoenix',
    'Piano', 'Pickle', 'Pigeon', 'Piglet', 'Pika', 'Pillow', 'Pilot', 'Pine', 'Pineapple', 'Pioneer', 'Piper',
    'Pipit', 'Piranha', 'Pirate', 'Pitcher', 'Pixie', 'Planet', 'Plateau', 'Platypus', 'Plover', 'Plum', 'Poem',
    'Pollock', 'Pond', 'Pony', 'Poppy', 'Porpoise', 'Possum', 'Postcard', 'Pottery', 'Prairie', 'Praline', 'Pretzel',
    'Prism', 'Ptarmigan', 'Pudding', 'Puddle', 'Puffin', 'Puma', 'Pumpkin', 'Pup', 'Puppy', 'Puzzle', 'Quail',
    'Quartz', 'Quest', 'Quetzal', 'Quilt', 'Quokka', 'Quoll', 'Rabbit', 'Raccoon', 'Racer', 'Radish', 'Raft',
    'Rainbow', 'Raincoat', 'Raindrop', 'Rainstorm', 'Ram', 'Ranger', 'Rapids', 'Raptor', 'Raven', 'Recycler',
    'Redstart', 'Reedbuck', 'Reef', 'Reindeer', 'Rhythm', 'Ribbon', 'Riddle', 'Ridge', 'River', 'Robin', 'Rocket',
    'Roller', 'Rooster', 'Ruby', 'Sail', 'Sailboat', 'Sailor', 'Salmon', 'Sandal', 'Sandpiper', 'Sapling',
    'Sapphire', 'Sardine', 'Saucer', 'Savanna', 'Scallop', 'Scarf', 'Scooter', 'Scout', 'Seagull', 'Seahorse',
    'Seal', 'Seashell', 'Seed', 'Seedling', 'Sheep', 'Shell', 'Shrike', 'Shrimp', 'Sifaka', 'Signpost', 'Singer',
    'Siskin', 'Skater', 'Sketch', 'Skillet', 'Skink', 'Skipper', 'Skunk', 'Skylark', 'Sloth', 'Snail', 'Sneaker',
    'Snipe', 'Snowdrift', 'Snowflake', 'Snowman', 'Sonnet', 'Sorter', 'Sparrow', 'Spider', 'Spinner', 'Spoon',
    'Springbok', 'Sprinter', 'Sprocket', 'Sprout', 'Squid', 'Squirrel', 'Stamp', 'Star', 'Stardust', 'Starfish',
    'Starfruit', 'Starling', 'Stingray', 'Stork', 'Story', 'Stream', 'Sturgeon', 'Summit', 'Sunbeam', 'Sunbird',
    'Sunflower', 'Sunrise', 'Surfer', 'Swallow', 'Swan', 'Swordfish', 'Tadpole', 'Tamarin', 'Tanager', 'Tangerine',
    'Tapir', 'Tarsier', 'Teacup', 'Teapot', 'Telescope', 'Tenrec', 'Tent', 'Tern', 'Thinker', 'Thrush', 'Tiger',
    'Toad', 'Toaster', 'Toffee', 'Topaz', 'Tortoise', 'Toucan', 'Tower', 'Towhee', 'Tram', 'Treasure', 'Treehouse',
    'Trolley', 'Trophy', 'Trout', 'Truffle', 'Trumpet', 'Tuatara', 'Tuba', 'Tulip', 'Tuna', 'Tundra', 'Turkey',
    'Turnip', 'Turtle', 'Twirler', 'Ukulele', 'Umbrella', 'Unicorn', 'Upcycler', 'Valley', 'Viceroy', 'Vicuna',
    'Vine', 'Violin', 'Vireo', 'Vole', 'Voyage', 'Voyager', 'Waffle', 'Wagon', 'Wallaby', 'Walrus', 'Wanderer',
    'Wapiti', 'Warbler', 'Waterfall', 'Waxwing', 'Weasel', 'Whale', 'Wheel', 'Whimbrel', 'Whippet', 'Whisk',
    'Whistle', 'Willow', 'Windmill', 'Wizard', 'Wolf', 'Wombat', 'Wrapper', 'Wrasse', 'Wren',
    'Xylophone', 'Yak', 'Yeti', 'Zebra', 'Zebu', 'Zinnia',
  ];

  const SLOTS = [FIRST, MIDDLE, LAST];
  const MAX_WORD = 9;
  /** The longest possible name: three nine-letter words and two spaces. */
  const MAX_LENGTH = MAX_WORD * 3 + 2;

  /** A random integer in [0, n) from a 0..1 source (Math.random by default; a seeded one in tests). */
  const pick = (list, random) => list[Math.min(list.length - 1, Math.floor(random() * list.length))];

  /** Roll a new name: one word from each list, e.g. "Happy Mossy Otter". */
  function roll(random) {
    const r = random || Math.random;
    return SLOTS.map((list) => pick(list, r)).join(' ');
  }

  const SETS = SLOTS.map((list) => new Set(list));

  /** True only for a name that is exactly one word from each list, in order, separated by single spaces. */
  function isRolled(name) {
    if (typeof name !== 'string') return false;
    const parts = name.split(' ');
    return parts.length === 3 && parts.every((word, i) => SETS[i].has(word));
  }

  /** How many different names can be rolled. */
  const COMBINATIONS = FIRST.length * MIDDLE.length * LAST.length;

  return { FIRST, MIDDLE, LAST, MAX_WORD, MAX_LENGTH, COMBINATIONS, roll, isRolled };
}));
