-- US Tin: leaderboard names are rolled, never typed.
--
-- A name is three words, one from each of three lists: "Happy Mossy Otter". The lists below are generated from
-- lib/names.js by supabase/gen-names-migration.js (do not edit them by hand; a test fails if they drift). With this
-- migration set_player refuses any NEW name that is not exactly one word from each list, so nothing else can ever be
-- put on the board, whatever a modified client sends. Names players already have are left alone.
--
-- Apply after 20261123000000_leagues.sql.

-- ---------------------------------------------------------------------------
-- The word lists
-- ---------------------------------------------------------------------------

create table public.name_words (
  slot smallint not null check (slot between 1 and 3),
  word text not null check (word ~ '^[A-Z][a-z]{2,8}$'),
  primary key (slot, word)
);
alter table public.name_words enable row level security;
revoke all on public.name_words from public, anon, authenticated;

insert into public.name_words (slot, word) values
  (1, 'Able'), (1, 'Abundant'), (1, 'Ace'), (1, 'Active'), (1, 'Adaptable'), (1, 'Adept'), (1, 'Adored'), (1, 'Affable'),
  (1, 'Agile'), (1, 'Alert'), (1, 'Alpha'), (1, 'Amazed'), (1, 'Ambitious'), (1, 'Amicable'), (1, 'Amused'), (1, 'Ancient'),
  (1, 'Angelic'), (1, 'Animated'), (1, 'Appealing'), (1, 'Apt'), (1, 'Ardent'), (1, 'Artful'), (1, 'Assured'), (1, 'Astute'),
  (1, 'Atomic'), (1, 'Attentive'), (1, 'Authentic'), (1, 'Avid'), (1, 'Awake'), (1, 'Aware'), (1, 'Awesome'), (1, 'Balanced'),
  (1, 'Bashful'), (1, 'Beloved'), (1, 'Beta'), (1, 'Blessed'), (1, 'Blissful'), (1, 'Blithe'), (1, 'Bold'), (1, 'Bonny'),
  (1, 'Boundless'), (1, 'Brainy'), (1, 'Brave'), (1, 'Brawny'), (1, 'Bright'), (1, 'Brilliant'), (1, 'Brisk'), (1, 'Buoyant'),
  (1, 'Busy'), (1, 'Buzzy'), (1, 'Calm'), (1, 'Candid'), (1, 'Capable'), (1, 'Carefree'), (1, 'Careful'), (1, 'Caring'),
  (1, 'Casual'), (1, 'Charming'), (1, 'Chatty'), (1, 'Cheeky'), (1, 'Cheerful'), (1, 'Cheery'), (1, 'Cheesy'), (1, 'Cherished'),
  (1, 'Chic'), (1, 'Chipper'), (1, 'Chirpy'), (1, 'Chosen'), (1, 'Chummy'), (1, 'Classic'), (1, 'Clean'), (1, 'Clear'),
  (1, 'Clever'), (1, 'Cogent'), (1, 'Colossal'), (1, 'Comfy'), (1, 'Compact'), (1, 'Composed'), (1, 'Confident'), (1, 'Content'),
  (1, 'Convivial'), (1, 'Cool'), (1, 'Cordial'), (1, 'Corny'), (1, 'Cosmic'), (1, 'Courteous'), (1, 'Cozy'), (1, 'Crafty'),
  (1, 'Creative'), (1, 'Crisp'), (1, 'Cuddly'), (1, 'Curious'), (1, 'Cute'), (1, 'Dandy'), (1, 'Dapper'), (1, 'Dauntless'),
  (1, 'Dazzled'), (1, 'Dear'), (1, 'Decent'), (1, 'Decisive'), (1, 'Deft'), (1, 'Delighted'), (1, 'Devoted'), (1, 'Digital'),
  (1, 'Diligent'), (1, 'Discreet'), (1, 'Distinct'), (1, 'Dizzy'), (1, 'Dreamy'), (1, 'Droll'), (1, 'Dutiful'), (1, 'Dynamic'),
  (1, 'Eager'), (1, 'Earnest'), (1, 'Easy'), (1, 'Ebullient'), (1, 'Effusive'), (1, 'Elastic'), (1, 'Elated'), (1, 'Electric'),
  (1, 'Elegant'), (1, 'Eloquent'), (1, 'Empathic'), (1, 'Enchanted'), (1, 'Endless'), (1, 'Energetic'), (1, 'Enlivened'), (1, 'Enthused'),
  (1, 'Epic'), (1, 'Equal'), (1, 'Essential'), (1, 'Eternal'), (1, 'Everyday'), (1, 'Exact'), (1, 'Exalted'), (1, 'Excited'),
  (1, 'Exemplary'), (1, 'Expert'), (1, 'Exuberant'), (1, 'Fabled'), (1, 'Fabulous'), (1, 'Fair'), (1, 'Faithful'), (1, 'Famous'),
  (1, 'Fancy'), (1, 'Fantastic'), (1, 'Fearless'), (1, 'Fervent'), (1, 'Festive'), (1, 'Fierce'), (1, 'Fiery'), (1, 'Fine'),
  (1, 'Firm'), (1, 'Fit'), (1, 'Flashy'), (1, 'Flawless'), (1, 'Fleet'), (1, 'Fluent'), (1, 'Fluffy'), (1, 'Focused'),
  (1, 'Fond'), (1, 'Fortunate'), (1, 'Forward'), (1, 'Frank'), (1, 'Free'), (1, 'Fresh'), (1, 'Friendly'), (1, 'Frisky'),
  (1, 'Fruitful'), (1, 'Fun'), (1, 'Funky'), (1, 'Funny'), (1, 'Fuzzy'), (1, 'Gainful'), (1, 'Galactic'), (1, 'Gallant'),
  (1, 'Generous'), (1, 'Genial'), (1, 'Gentle'), (1, 'Genuine'), (1, 'Giant'), (1, 'Giddy'), (1, 'Gifted'), (1, 'Giga'),
  (1, 'Gigantic'), (1, 'Giggly'), (1, 'Glad'), (1, 'Gladsome'), (1, 'Glamorous'), (1, 'Gleeful'), (1, 'Glorious'), (1, 'Glowing'),
  (1, 'Good'), (1, 'Goofy'), (1, 'Graceful'), (1, 'Gracious'), (1, 'Grand'), (1, 'Grateful'), (1, 'Great'), (1, 'Groovy'),
  (1, 'Grounded'), (1, 'Gutsy'), (1, 'Hale'), (1, 'Handy'), (1, 'Happy'), (1, 'Hardy'), (1, 'Harmless'), (1, 'Heartfelt'),
  (1, 'Hearty'), (1, 'Helpful'), (1, 'Heroic'), (1, 'Hilarious'), (1, 'Hip'), (1, 'Homey'), (1, 'Honest'), (1, 'Honored'),
  (1, 'Hopeful'), (1, 'Humble'), (1, 'Hyper'), (1, 'Ideal'), (1, 'Idyllic'), (1, 'Imaginary'), (1, 'Immense'), (1, 'Impish'),
  (1, 'Incisive'), (1, 'Ingenious'), (1, 'Innocent'), (1, 'Inspired'), (1, 'Intrepid'), (1, 'Intuitive'), (1, 'Inventive'), (1, 'Jaunty'),
  (1, 'Jazz'), (1, 'Jazzy'), (1, 'Jiggly'), (1, 'Jocund'), (1, 'Jolly'), (1, 'Jovial'), (1, 'Joyful'), (1, 'Jubilant'),
  (1, 'Judicious'), (1, 'Jumbo'), (1, 'Jumpy'), (1, 'Just'), (1, 'Keen'), (1, 'Kind'), (1, 'Kindly'), (1, 'Kooky'),
  (1, 'Large'), (1, 'Lazy'), (1, 'Lean'), (1, 'Level'), (1, 'Light'), (1, 'Likable'), (1, 'Likeable'), (1, 'Limber'),
  (1, 'Little'), (1, 'Lively'), (1, 'Lofty'), (1, 'Long'), (1, 'Loopy'), (1, 'Lovable'), (1, 'Lovely'), (1, 'Loyal'),
  (1, 'Lucid'), (1, 'Lucky'), (1, 'Lunar'), (1, 'Lush'), (1, 'Lyrical'), (1, 'Magic'), (1, 'Magical'), (1, 'Majestic'),
  (1, 'Marvelous'), (1, 'Massive'), (1, 'Max'), (1, 'Maxi'), (1, 'Mega'), (1, 'Mellow'), (1, 'Melodic'), (1, 'Mended'),
  (1, 'Merciful'), (1, 'Merry'), (1, 'Micro'), (1, 'Mighty'), (1, 'Mindful'), (1, 'Mini'), (1, 'Mirthful'), (1, 'Modern'),
  (1, 'Modest'), (1, 'Mystic'), (1, 'Nano'), (1, 'Narrow'), (1, 'Natural'), (1, 'Neat'), (1, 'Neo'), (1, 'Nifty'),
  (1, 'Nimble'), (1, 'Noble'), (1, 'Normal'), (1, 'Notable'), (1, 'Novel'), (1, 'Observant'), (1, 'Omni'), (1, 'Open'),
  (1, 'Optimal'), (1, 'Opulent'), (1, 'Orderly'), (1, 'Original'), (1, 'Pacific'), (1, 'Painless'), (1, 'Patched'), (1, 'Patient'),
  (1, 'Peaceful'), (1, 'Peerless'), (1, 'Peppery'), (1, 'Peppy'), (1, 'Perfect'), (1, 'Perky'), (1, 'Petite'), (1, 'Pippy'),
  (1, 'Placid'), (1, 'Playful'), (1, 'Pleasant'), (1, 'Plucky'), (1, 'Plush'), (1, 'Poised'), (1, 'Polished'), (1, 'Polite'),
  (1, 'Popular'), (1, 'Positive'), (1, 'Powerful'), (1, 'Practical'), (1, 'Precious'), (1, 'Pretty'), (1, 'Priceless'), (1, 'Prime'),
  (1, 'Prized'), (1, 'Profound'), (1, 'Prompt'), (1, 'Proper'), (1, 'Proud'), (1, 'Punctual'), (1, 'Pure'), (1, 'Quaint'),
  (1, 'Quick'), (1, 'Quiet'), (1, 'Quirky'), (1, 'Quizzical'), (1, 'Radiant'), (1, 'Rapid'), (1, 'Ready'), (1, 'Real'),
  (1, 'Reassured'), (1, 'Receptive'), (1, 'Refilled'), (1, 'Refined'), (1, 'Refreshed'), (1, 'Regal'), (1, 'Relaxed'), (1, 'Reliable'),
  (1, 'Renewed'), (1, 'Repaired'), (1, 'Resilient'), (1, 'Resolute'), (1, 'Respected'), (1, 'Rested'), (1, 'Restful'), (1, 'Restored'),
  (1, 'Retro'), (1, 'Reused'), (1, 'Rich'), (1, 'Right'), (1, 'Righteous'), (1, 'Robust'), (1, 'Romantic'), (1, 'Roomy'),
  (1, 'Round'), (1, 'Rowdy'), (1, 'Royal'), (1, 'Rugged'), (1, 'Rustic'), (1, 'Safe'), (1, 'Sagacious'), (1, 'Sassy'),
  (1, 'Satisfied'), (1, 'Savvy'), (1, 'Scenic'), (1, 'Scholarly'), (1, 'Seasoned'), (1, 'Secure'), (1, 'Selfless'), (1, 'Sensible'),
  (1, 'Sensitive'), (1, 'Serene'), (1, 'Settled'), (1, 'Shiny'), (1, 'Short'), (1, 'Shrewd'), (1, 'Shy'), (1, 'Silly'),
  (1, 'Simple'), (1, 'Sincere'), (1, 'Skilled'), (1, 'Sleek'), (1, 'Sleepy'), (1, 'Slick'), (1, 'Smart'), (1, 'Smiley'),
  (1, 'Smooth'), (1, 'Snappy'), (1, 'Snazzy'), (1, 'Snug'), (1, 'Snuggly'), (1, 'Sociable'), (1, 'Social'), (1, 'Solid'),
  (1, 'Sparkly'), (1, 'Sparky'), (1, 'Special'), (1, 'Speedy'), (1, 'Spiffy'), (1, 'Spirited'), (1, 'Splendid'), (1, 'Sporty'),
  (1, 'Sprightly'), (1, 'Spry'), (1, 'Spunky'), (1, 'Square'), (1, 'Squeaky'), (1, 'Squishy'), (1, 'Stable'), (1, 'Stalwart'),
  (1, 'Steadfast'), (1, 'Steady'), (1, 'Stellar'), (1, 'Stitched'), (1, 'Stout'), (1, 'Studious'), (1, 'Stylish'), (1, 'Suave'),
  (1, 'Subtle'), (1, 'Succinct'), (1, 'Sunny'), (1, 'Super'), (1, 'Superb'), (1, 'Supreme'), (1, 'Sure'), (1, 'Swell'),
  (1, 'Swift'), (1, 'Tactful'), (1, 'Tall'), (1, 'Tame'), (1, 'Tasty'), (1, 'Teensy'), (1, 'Tenacious'), (1, 'Tender'),
  (1, 'Terrific'), (1, 'Thankful'), (1, 'Thorough'), (1, 'Thrifty'), (1, 'Thrilled'), (1, 'Thriving'), (1, 'Tickled'), (1, 'Tidy'),
  (1, 'Timely'), (1, 'Tiny'), (1, 'Toasted'), (1, 'Tolerant'), (1, 'Top'), (1, 'Topnotch'), (1, 'Total'), (1, 'Tough'),
  (1, 'Tranquil'), (1, 'Treasured'), (1, 'Trendy'), (1, 'Trim'), (1, 'True'), (1, 'Trustful'), (1, 'Trusty'), (1, 'Truthful'),
  (1, 'Turbo'), (1, 'Twinkly'), (1, 'Ultra'), (1, 'Unafraid'), (1, 'Unbeaten'), (1, 'Unbridled'), (1, 'Undaunted'), (1, 'Unfazed'),
  (1, 'Unified'), (1, 'Unique'), (1, 'United'), (1, 'Unselfish'), (1, 'Upbeat'), (1, 'Uplifted'), (1, 'Upright'), (1, 'Urbane'),
  (1, 'Useful'), (1, 'Valiant'), (1, 'Valorous'), (1, 'Valued'), (1, 'Vast'), (1, 'Venerable'), (1, 'Versatile'), (1, 'Vibrant'),
  (1, 'Vigilant'), (1, 'Vigorous'), (1, 'Virtuous'), (1, 'Visionary'), (1, 'Vital'), (1, 'Vivacious'), (1, 'Vivid'), (1, 'Vocal'),
  (1, 'Voluble'), (1, 'Wacky'), (1, 'Wakeful'), (1, 'Warm'), (1, 'Watchful'), (1, 'Wavy'), (1, 'Wee'), (1, 'Welcome'),
  (1, 'Whole'), (1, 'Wholesome'), (1, 'Wide'), (1, 'Wiggly'), (1, 'Wild'), (1, 'Willing'), (1, 'Willowy'), (1, 'Winning'),
  (1, 'Winsome'), (1, 'Wired'), (1, 'Wise'), (1, 'Wishful'), (1, 'Witty'), (1, 'Wizardly'), (1, 'Wobbly'), (1, 'Wonderful'),
  (1, 'Wondrous'), (1, 'Worthy'), (1, 'Young'), (1, 'Youthful'), (1, 'Yummy'), (1, 'Zany'), (1, 'Zealous'), (1, 'Zen'),
  (1, 'Zestful'), (1, 'Zesty'), (1, 'Zigzag'), (1, 'Zippy'),
  (2, 'Accepting'), (2, 'Airborne'), (2, 'Alluring'), (2, 'Almond'), (2, 'Alpine'), (2, 'Ambient'), (2, 'Angular'), (2, 'Apple'),
  (2, 'Aqua'), (2, 'Aquatic'), (2, 'Arched'), (2, 'Arctic'), (2, 'Aromatic'), (2, 'Ashen'), (2, 'Aspen'), (2, 'Aubergine'),
  (2, 'Auburn'), (2, 'Autumn'), (2, 'Azure'), (2, 'Baking'), (2, 'Banana'), (2, 'Barley'), (2, 'Basil'), (2, 'Basking'),
  (2, 'Beaded'), (2, 'Beaming'), (2, 'Bean'), (2, 'Beet'), (2, 'Beige'), (2, 'Biking'), (2, 'Billowy'), (2, 'Birch'),
  (2, 'Biscuit'), (2, 'Bisque'), (2, 'Blond'), (2, 'Blooming'), (2, 'Blossom'), (2, 'Blue'), (2, 'Bluebell'), (2, 'Blush'),
  (2, 'Blustery'), (2, 'Bobbing'), (2, 'Bordeaux'), (2, 'Bouncing'), (2, 'Bouncy'), (2, 'Braided'), (2, 'Branchy'), (2, 'Brass'),
  (2, 'Breezy'), (2, 'Brick'), (2, 'Bronze'), (2, 'Brook'), (2, 'Brown'), (2, 'Bubbly'), (2, 'Buff'), (2, 'Building'),
  (2, 'Bumpy'), (2, 'Burgundy'), (2, 'Bustling'), (2, 'Butter'), (2, 'Buttercup'), (2, 'Buttery'), (2, 'Buzzing'), (2, 'Cabbage'),
  (2, 'Camping'), (2, 'Candy'), (2, 'Canvas'), (2, 'Cardboard'), (2, 'Carmine'), (2, 'Cascading'), (2, 'Cashew'), (2, 'Cedar'),
  (2, 'Celery'), (2, 'Ceramic'), (2, 'Cerise'), (2, 'Cerulean'), (2, 'Chalky'), (2, 'Charcoal'), (2, 'Checkered'), (2, 'Cheddar'),
  (2, 'Cheering'), (2, 'Chestnut'), (2, 'Chewy'), (2, 'Chili'), (2, 'Chirping'), (2, 'Chocolate'), (2, 'Chowder'), (2, 'Chrome'),
  (2, 'Chuckling'), (2, 'Cinnamon'), (2, 'Circular'), (2, 'Citron'), (2, 'Citrus'), (2, 'Clapping'), (2, 'Claret'), (2, 'Clay'),
  (2, 'Climbing'), (2, 'Cloudlike'), (2, 'Cloudy'), (2, 'Clover'), (2, 'Coastal'), (2, 'Cobalt'), (2, 'Coiled'), (2, 'Colorful'),
  (2, 'Concrete'), (2, 'Cooking'), (2, 'Copper'), (2, 'Cork'), (2, 'Cotton'), (2, 'Counting'), (2, 'Crafting'), (2, 'Cream'),
  (2, 'Creamy'), (2, 'Crescent'), (2, 'Crimson'), (2, 'Crinkly'), (2, 'Crispy'), (2, 'Crumbly'), (2, 'Crunchy'), (2, 'Cuddling'),
  (2, 'Curly'), (2, 'Currant'), (2, 'Curvy'), (2, 'Custard'), (2, 'Cyan'), (2, 'Dainty'), (2, 'Dancing'), (2, 'Dandelion'),
  (2, 'Dappled'), (2, 'Daring'), (2, 'Darting'), (2, 'Dashing'), (2, 'Dawn'), (2, 'Dazzling'), (2, 'Denim'), (2, 'Desert'),
  (2, 'Dewdrop'), (2, 'Dewy'), (2, 'Dill'), (2, 'Diving'), (2, 'Dotted'), (2, 'Dotty'), (2, 'Draped'), (2, 'Drawing'),
  (2, 'Dreaming'), (2, 'Dreamlike'), (2, 'Drifting'), (2, 'Drizzly'), (2, 'Droplet'), (2, 'Dusky'), (2, 'Dusty'), (2, 'Earthy'),
  (2, 'Ebony'), (2, 'Eclair'), (2, 'Eggshell'), (2, 'Ember'), (2, 'Emerald'), (2, 'Enduring'), (2, 'Engaging'), (2, 'Ethereal'),
  (2, 'Evergreen'), (2, 'Exploring'), (2, 'Feathery'), (2, 'Felt'), (2, 'Fennel'), (2, 'Fernlike'), (2, 'Fetching'), (2, 'Fig'),
  (2, 'Fizzy'), (2, 'Flaky'), (2, 'Flashing'), (2, 'Flax'), (2, 'Fleece'), (2, 'Flint'), (2, 'Floating'), (2, 'Floral'),
  (2, 'Flour'), (2, 'Flowery'), (2, 'Flowing'), (2, 'Fluttery'), (2, 'Foamy'), (2, 'Foggy'), (2, 'Fondue'), (2, 'Forested'),
  (2, 'Freckled'), (2, 'Frilly'), (2, 'Fringed'), (2, 'Frosted'), (2, 'Frosty'), (2, 'Frozen'), (2, 'Fruity'), (2, 'Fuchsia'),
  (2, 'Furry'), (2, 'Galloping'), (2, 'Gardening'), (2, 'Garlic'), (2, 'Gelato'), (2, 'Giggling'), (2, 'Gilded'), (2, 'Ginger'),
  (2, 'Glacial'), (2, 'Glass'), (2, 'Glassy'), (2, 'Glazed'), (2, 'Gleaming'), (2, 'Gliding'), (2, 'Glimmery'), (2, 'Glossy'),
  (2, 'Golden'), (2, 'Goldenrod'), (2, 'Gourd'), (2, 'Grainy'), (2, 'Granite'), (2, 'Granola'), (2, 'Grape'), (2, 'Grassy'),
  (2, 'Gravel'), (2, 'Gray'), (2, 'Green'), (2, 'Greeting'), (2, 'Grinning'), (2, 'Gritty'), (2, 'Growing'), (2, 'Guava'),
  (2, 'Guiding'), (2, 'Gunmetal'), (2, 'Gusty'), (2, 'Hairy'), (2, 'Harlequin'), (2, 'Hatching'), (2, 'Hazel'), (2, 'Hazelnut'),
  (2, 'Hazy'), (2, 'Heather'), (2, 'Helping'), (2, 'Hexagon'), (2, 'Hickory'), (2, 'Hiking'), (2, 'Hilly'), (2, 'Hollow'),
  (2, 'Honey'), (2, 'Honeydew'), (2, 'Honeyed'), (2, 'Hooked'), (2, 'Hopping'), (2, 'Hugging'), (2, 'Humid'), (2, 'Humming'),
  (2, 'Hummus'), (2, 'Icy'), (2, 'Imagining'), (2, 'Indigo'), (2, 'Inky'), (2, 'Inventing'), (2, 'Inviting'), (2, 'Iron'),
  (2, 'Ivory'), (2, 'Jagged'), (2, 'Jam'), (2, 'Jasper'), (2, 'Jelly'), (2, 'Jet'), (2, 'Juggling'), (2, 'Jumping'),
  (2, 'Juniper'), (2, 'Kale'), (2, 'Kayaking'), (2, 'Khaki'), (2, 'Knitted'), (2, 'Knitting'), (2, 'Knotty'), (2, 'Knowing'),
  (2, 'Kumquat'), (2, 'Lakeside'), (2, 'Lapis'), (2, 'Lasting'), (2, 'Latte'), (2, 'Laughing'), (2, 'Lavender'), (2, 'Layered'),
  (2, 'Leafed'), (2, 'Leafy'), (2, 'Leaping'), (2, 'Learning'), (2, 'Leather'), (2, 'Leek'), (2, 'Lemony'), (2, 'Licorice'),
  (2, 'Lilac'), (2, 'Lime'), (2, 'Lined'), (2, 'Linen'), (2, 'Lollipop'), (2, 'Looped'), (2, 'Lounging'), (2, 'Luminous'),
  (2, 'Lumpy'), (2, 'Magenta'), (2, 'Mahogany'), (2, 'Mallow'), (2, 'Marbled'), (2, 'Marching'), (2, 'Marmalade'), (2, 'Maroon'),
  (2, 'Mashed'), (2, 'Mauve'), (2, 'Meringue'), (2, 'Metal'), (2, 'Midnight'), (2, 'Mild'), (2, 'Mint'), (2, 'Minty'),
  (2, 'Mirrored'), (2, 'Misty'), (2, 'Mocha'), (2, 'Moonlit'), (2, 'Mossy'), (2, 'Mottled'), (2, 'Mountain'), (2, 'Muddy'),
  (2, 'Mulberry'), (2, 'Munching'), (2, 'Mushy'), (2, 'Mustard'), (2, 'Muted'), (2, 'Napping'), (2, 'Navy'), (2, 'Nectar'),
  (2, 'Nested'), (2, 'Nibbling'), (2, 'Notched'), (2, 'Nubby'), (2, 'Nurturing'), (2, 'Nutmeg'), (2, 'Nutty'), (2, 'Oatcake'),
  (2, 'Oatmeal'), (2, 'Oaty'), (2, 'Obliging'), (2, 'Oblong'), (2, 'Oceanic'), (2, 'Ochre'), (2, 'Okra'), (2, 'Olive'),
  (2, 'Onyx'), (2, 'Orange'), (2, 'Outgoing'), (2, 'Oval'), (2, 'Paddling'), (2, 'Painted'), (2, 'Painting'), (2, 'Paper'),
  (2, 'Paprika'), (2, 'Parsley'), (2, 'Pasta'), (2, 'Pastel'), (2, 'Patchy'), (2, 'Patterned'), (2, 'Peachy'), (2, 'Peanut'),
  (2, 'Pearly'), (2, 'Pebbly'), (2, 'Pecan'), (2, 'Pewter'), (2, 'Pickled'), (2, 'Pie'), (2, 'Pillowy'), (2, 'Pink'),
  (2, 'Pistachio'), (2, 'Pita'), (2, 'Pizza'), (2, 'Plaid'), (2, 'Planting'), (2, 'Plastic'), (2, 'Platinum'), (2, 'Pleated'),
  (2, 'Pointy'), (2, 'Polar'), (2, 'Polka'), (2, 'Pomelo'), (2, 'Popcorn'), (2, 'Powder'), (2, 'Prancing'), (2, 'Prickly'),
  (2, 'Primrose'), (2, 'Prismatic'), (2, 'Puffy'), (2, 'Purple'), (2, 'Purring'), (2, 'Quilted'), (2, 'Quince'), (2, 'Racing'),
  (2, 'Rainy'), (2, 'Raisin'), (2, 'Raspberry'), (2, 'Ravioli'), (2, 'Reading'), (2, 'Recycled'), (2, 'Recycling'), (2, 'Red'),
  (2, 'Redwood'), (2, 'Relaxing'), (2, 'Resting'), (2, 'Reusable'), (2, 'Reusing'), (2, 'Rewarding'), (2, 'Rhubarb'), (2, 'Rice'),
  (2, 'Rippled'), (2, 'Roaming'), (2, 'Rocky'), (2, 'Rolling'), (2, 'Rose'), (2, 'Rosy'), (2, 'Rowing'), (2, 'Rubber'),
  (2, 'Rubbery'), (2, 'Ruffled'), (2, 'Rural'), (2, 'Russet'), (2, 'Rusty'), (2, 'Rye'), (2, 'Saffron'), (2, 'Sage'),
  (2, 'Sailing'), (2, 'Salsa'), (2, 'Salty'), (2, 'Sandstone'), (2, 'Sandy'), (2, 'Satiny'), (2, 'Scalloped'), (2, 'Scaly'),
  (2, 'Scarlet'), (2, 'Scurrying'), (2, 'Seaside'), (2, 'Sepia'), (2, 'Sesame'), (2, 'Shaded'), (2, 'Shady'), (2, 'Shaggy'),
  (2, 'Sharing'), (2, 'Sheer'), (2, 'Shelled'), (2, 'Sherbet'), (2, 'Shimmery'), (2, 'Shining'), (2, 'Sienna'), (2, 'Silken'),
  (2, 'Silky'), (2, 'Silver'), (2, 'Singing'), (2, 'Sipping'), (2, 'Skating'), (2, 'Sketching'), (2, 'Skiing'), (2, 'Skipping'),
  (2, 'Sky'), (2, 'Skyward'), (2, 'Slate'), (2, 'Sledding'), (2, 'Sleeky'), (2, 'Sleety'), (2, 'Slippery'), (2, 'Smiling'),
  (2, 'Smoke'), (2, 'Smoky'), (2, 'Snacking'), (2, 'Snoozing'), (2, 'Snow'), (2, 'Snowy'), (2, 'Soaring'), (2, 'Soft'),
  (2, 'Solar'), (2, 'Soothing'), (2, 'Sooty'), (2, 'Sorbet'), (2, 'Sorting'), (2, 'Sourdough'), (2, 'Soy'), (2, 'Sparkling'),
  (2, 'Spinning'), (2, 'Spiral'), (2, 'Splashing'), (2, 'Splotchy'), (2, 'Spongy'), (2, 'Spotted'), (2, 'Spring'), (2, 'Springy'),
  (2, 'Sprinkled'), (2, 'Sprouting'), (2, 'Spruce'), (2, 'Squash'), (2, 'Squashy'), (2, 'Squiggly'), (2, 'Starlit'), (2, 'Starry'),
  (2, 'Steel'), (2, 'Steely'), (2, 'Sterling'), (2, 'Sticky'), (2, 'Stirring'), (2, 'Stormy'), (2, 'Strapping'), (2, 'Straw'),
  (2, 'Streaked'), (2, 'Striped'), (2, 'Stripy'), (2, 'Strolling'), (2, 'Strudel'), (2, 'Studded'), (2, 'Stunning'), (2, 'Sugary'),
  (2, 'Summer'), (2, 'Sundae'), (2, 'Sunlit'), (2, 'Sunset'), (2, 'Surfing'), (2, 'Sushi'), (2, 'Swimming'), (2, 'Swirling'),
  (2, 'Swirly'), (2, 'Swooping'), (2, 'Taco'), (2, 'Tan'), (2, 'Tangled'), (2, 'Tangy'), (2, 'Tapered'), (2, 'Tart'),
  (2, 'Tasseled'), (2, 'Taupe'), (2, 'Tawny'), (2, 'Tea'), (2, 'Teal'), (2, 'Teeming'), (2, 'Textured'), (2, 'Thinking'),
  (2, 'Thistle'), (2, 'Tidal'), (2, 'Tiered'), (2, 'Tilted'), (2, 'Timber'), (2, 'Tin'), (2, 'Tinkering'), (2, 'Toasty'),
  (2, 'Tomato'), (2, 'Topsy'), (2, 'Triangle'), (2, 'Tropic'), (2, 'Tropical'), (2, 'Trotting'), (2, 'Trusting'), (2, 'Trying'),
  (2, 'Tufted'), (2, 'Tumbling'), (2, 'Turquoise'), (2, 'Tweeting'), (2, 'Twilight'), (2, 'Twinkling'), (2, 'Twirling'), (2, 'Twirly'),
  (2, 'Twisted'), (2, 'Umber'), (2, 'Upcycled'), (2, 'Vanilla'), (2, 'Vaulted'), (2, 'Veined'), (2, 'Velvet'), (2, 'Velvety'),
  (2, 'Vermilion'), (2, 'Violet'), (2, 'Waddling'), (2, 'Walnut'), (2, 'Wandering'), (2, 'Watery'), (2, 'Waving'), (2, 'Waxy'),
  (2, 'Weathered'), (2, 'Weaving'), (2, 'Webbed'), (2, 'Welcoming'), (2, 'Wheat'), (2, 'Whirling'), (2, 'Whistling'), (2, 'White'),
  (2, 'Whizzing'), (2, 'Wicker'), (2, 'Windy'), (2, 'Winged'), (2, 'Winking'), (2, 'Winter'), (2, 'Wispy'), (2, 'Wisteria'),
  (2, 'Wondering'), (2, 'Wooded'), (2, 'Wooden'), (2, 'Woodland'), (2, 'Wool'), (2, 'Woolly'), (2, 'Wooly'), (2, 'Woven'),
  (2, 'Wrinkly'), (2, 'Writing'), (2, 'Yam'), (2, 'Yarn'), (2, 'Yawning'), (2, 'Yearning'), (2, 'Yellow'), (2, 'Yogurt'),
  (2, 'Zigzagged'), (2, 'Zinc'), (2, 'Zippered'), (2, 'Zipping'), (2, 'Zooming'), (2, 'Zucchini'),
  (3, 'Aardvark'), (3, 'Accordion'), (3, 'Acorn'), (3, 'Albatross'), (3, 'Alligator'), (3, 'Aloe'), (3, 'Alpaca'), (3, 'Amber'),
  (3, 'Anchor'), (3, 'Anteater'), (3, 'Antelope'), (3, 'Anthem'), (3, 'Antlion'), (3, 'Apricot'), (3, 'Apron'), (3, 'Armadillo'),
  (3, 'Aster'), (3, 'Auklet'), (3, 'Aurora'), (3, 'Avocet'), (3, 'Axolotl'), (3, 'Backpack'), (3, 'Badge'), (3, 'Badger'),
  (3, 'Bagel'), (3, 'Bagpipe'), (3, 'Ballad'), (3, 'Balloon'), (3, 'Bamboo'), (3, 'Banjo'), (3, 'Banner'), (3, 'Bard'),
  (3, 'Barn'), (3, 'Barnacle'), (3, 'Barracuda'), (3, 'Barrel'), (3, 'Basilisk'), (3, 'Basket'), (3, 'Bassoon'), (3, 'Beacon'),
  (3, 'Beanie'), (3, 'Beanstalk'), (3, 'Bear'), (3, 'Bee'), (3, 'Beetle'), (3, 'Bell'), (3, 'Berry'), (3, 'Biker'),
  (3, 'Biscotti'), (3, 'Bison'), (3, 'Bittern'), (3, 'Blanket'), (3, 'Blender'), (3, 'Blueberry'), (3, 'Bluebird'), (3, 'Bluejay'),
  (3, 'Bobcat'), (3, 'Bobolink'), (3, 'Bongo'), (3, 'Bonsai'), (3, 'Boomerang'), (3, 'Boot'), (3, 'Bottle'), (3, 'Bottlecap'),
  (3, 'Boulder'), (3, 'Bramble'), (3, 'Branch'), (3, 'Breeze'), (3, 'Bridge'), (3, 'Brownie'), (3, 'Bubble'), (3, 'Bucket'),
  (3, 'Bud'), (3, 'Buffalo'), (3, 'Bugle'), (3, 'Builder'), (3, 'Bullfrog'), (3, 'Bumblebee'), (3, 'Bunny'), (3, 'Bunting'),
  (3, 'Butterfly'), (3, 'Button'), (3, 'Cabin'), (3, 'Cactus'), (3, 'Calf'), (3, 'Camel'), (3, 'Camper'), (3, 'Campfire'),
  (3, 'Can'), (3, 'Canary'), (3, 'Candle'), (3, 'Cannoli'), (3, 'Canoe'), (3, 'Canyon'), (3, 'Cape'), (3, 'Captain'),
  (3, 'Capybara'), (3, 'Caracal'), (3, 'Caramel'), (3, 'Cardinal'), (3, 'Caribou'), (3, 'Carrot'), (3, 'Carton'), (3, 'Cassowary'),
  (3, 'Castle'), (3, 'Cat'), (3, 'Catfish'), (3, 'Cavern'), (3, 'Cello'), (3, 'Chaffinch'), (3, 'Chameleon'), (3, 'Cheetah'),
  (3, 'Cherry'), (3, 'Chick'), (3, 'Chickadee'), (3, 'Chime'), (3, 'Chipmunk'), (3, 'Chorus'), (3, 'Chukar'), (3, 'Churro'),
  (3, 'Cicada'), (3, 'Civet'), (3, 'Clam'), (3, 'Clarinet'), (3, 'Cliff'), (3, 'Climber'), (3, 'Clock'), (3, 'Cloud'),
  (3, 'Coati'), (3, 'Coconut'), (3, 'Cocoon'), (3, 'Cod'), (3, 'Collage'), (3, 'Colobus'), (3, 'Comet'), (3, 'Compass'),
  (3, 'Composter'), (3, 'Condor'), (3, 'Cone'), (3, 'Cookie'), (3, 'Coral'), (3, 'Cormorant'), (3, 'Cosmos'), (3, 'Cottage'),
  (3, 'Cougar'), (3, 'Cove'), (3, 'Cow'), (3, 'Coyote'), (3, 'Crab'), (3, 'Cracker'), (3, 'Cranberry'), (3, 'Crane'),
  (3, 'Crate'), (3, 'Crayon'), (3, 'Creek'), (3, 'Cricket'), (3, 'Crow'), (3, 'Crown'), (3, 'Crumpet'), (3, 'Crystal'),
  (3, 'Cub'), (3, 'Cuckoo'), (3, 'Cupcake'), (3, 'Curlew'), (3, 'Cushion'), (3, 'Cygnet'), (3, 'Cymbal'), (3, 'Daisy'),
  (3, 'Damselfly'), (3, 'Dancer'), (3, 'Daydream'), (3, 'Deer'), (3, 'Diamond'), (3, 'Dingo'), (3, 'Dinosaur'), (3, 'Dipper'),
  (3, 'Diver'), (3, 'Dolphin'), (3, 'Donkey'), (3, 'Donut'), (3, 'Doodle'), (3, 'Dormouse'), (3, 'Dove'), (3, 'Dragon'),
  (3, 'Dragonfly'), (3, 'Dreamer'), (3, 'Drum'), (3, 'Drummer'), (3, 'Duck'), (3, 'Duckling'), (3, 'Dugong'), (3, 'Dumpling'),
  (3, 'Dune'), (3, 'Dunlin'), (3, 'Eagle'), (3, 'Eclipse'), (3, 'Eel'), (3, 'Egret'), (3, 'Eider'), (3, 'Eland'),
  (3, 'Elephant'), (3, 'Elf'), (3, 'Elk'), (3, 'Emu'), (3, 'Envelope'), (3, 'Eraser'), (3, 'Ermine'), (3, 'Explorer'),
  (3, 'Fable'), (3, 'Fairy'), (3, 'Falcon'), (3, 'Fawn'), (3, 'Feather'), (3, 'Fern'), (3, 'Ferret'), (3, 'Ferry'),
  (3, 'Fiddle'), (3, 'Finch'), (3, 'Firefly'), (3, 'Flag'), (3, 'Flamingo'), (3, 'Fledgling'), (3, 'Flounder'), (3, 'Flower'),
  (3, 'Flute'), (3, 'Flyer'), (3, 'Foal'), (3, 'Forest'), (3, 'Fossa'), (3, 'Fossil'), (3, 'Fountain'), (3, 'Fox'),
  (3, 'Frog'), (3, 'Fudge'), (3, 'Fulmar'), (3, 'Gadget'), (3, 'Galaxy'), (3, 'Gannet'), (3, 'Garden'), (3, 'Gardener'),
  (3, 'Garfish'), (3, 'Garnet'), (3, 'Gazelle'), (3, 'Gecko'), (3, 'Genet'), (3, 'Geode'), (3, 'Gerbil'), (3, 'Geyser'),
  (3, 'Gharial'), (3, 'Gibbon'), (3, 'Giraffe'), (3, 'Gizmo'), (3, 'Glacier'), (3, 'Glider'), (3, 'Gnome'), (3, 'Gnu'),
  (3, 'Goat'), (3, 'Goggles'), (3, 'Goldfinch'), (3, 'Goldfish'), (3, 'Gong'), (3, 'Goose'), (3, 'Gopher'), (3, 'Gorilla'),
  (3, 'Gosling'), (3, 'Grebe'), (3, 'Greyhound'), (3, 'Griffin'), (3, 'Grizzly'), (3, 'Grosbeak'), (3, 'Grouse'), (3, 'Grove'),
  (3, 'Guitar'), (3, 'Gull'), (3, 'Guppy'), (3, 'Haddock'), (3, 'Haiku'), (3, 'Halibut'), (3, 'Hammock'), (3, 'Hamster'),
  (3, 'Harbor'), (3, 'Hare'), (3, 'Harmony'), (3, 'Harp'), (3, 'Harrier'), (3, 'Harvest'), (3, 'Hatchling'), (3, 'Hawk'),
  (3, 'Hedgehog'), (3, 'Helmet'), (3, 'Heron'), (3, 'Hiker'), (3, 'Hill'), (3, 'Hippo'), (3, 'Hornbill'), (3, 'Horse'),
  (3, 'Hoverfly'), (3, 'Husky'), (3, 'Hyrax'), (3, 'Ibex'), (3, 'Ibis'), (3, 'Icicle'), (3, 'Iguana'), (3, 'Impala'),
  (3, 'Iris'), (3, 'Island'), (3, 'Ivy'), (3, 'Jackal'), (3, 'Jade'), (3, 'Jaguar'), (3, 'Jar'), (3, 'Jay'),
  (3, 'Jellyfish'), (3, 'Jerboa'), (3, 'Jester'), (3, 'Jingle'), (3, 'Joey'), (3, 'Journey'), (3, 'Juggler'), (3, 'Jumper'),
  (3, 'Junco'), (3, 'Jungle'), (3, 'Kangaroo'), (3, 'Katydid'), (3, 'Kayak'), (3, 'Kazoo'), (3, 'Kelp'), (3, 'Kestrel'),
  (3, 'Kettle'), (3, 'Kinglet'), (3, 'Kinkajou'), (3, 'Kite'), (3, 'Kitten'), (3, 'Kittiwake'), (3, 'Kiwi'), (3, 'Knight'),
  (3, 'Koala'), (3, 'Koi'), (3, 'Krill'), (3, 'Ladle'), (3, 'Ladybug'), (3, 'Lagoon'), (3, 'Lake'), (3, 'Lamb'),
  (3, 'Lamp'), (3, 'Lamppost'), (3, 'Langur'), (3, 'Lantern'), (3, 'Lapwing'), (3, 'Lark'), (3, 'Leaf'), (3, 'Legend'),
  (3, 'Lemming'), (3, 'Lemon'), (3, 'Lemur'), (3, 'Lens'), (3, 'Leopard'), (3, 'Leveret'), (3, 'Lily'), (3, 'Limpet'),
  (3, 'Linnet'), (3, 'Lion'), (3, 'Lizard'), (3, 'Llama'), (3, 'Lobster'), (3, 'Locust'), (3, 'Loon'), (3, 'Lotus'),
  (3, 'Lullaby'), (3, 'Lynx'), (3, 'Macaw'), (3, 'Mackerel'), (3, 'Magnet'), (3, 'Magpie'), (3, 'Maker'), (3, 'Mallard'),
  (3, 'Mammoth'), (3, 'Manatee'), (3, 'Mandolin'), (3, 'Mango'), (3, 'Mantis'), (3, 'Maple'), (3, 'Maracas'), (3, 'Marble'),
  (3, 'Margay'), (3, 'Marlin'), (3, 'Marmot'), (3, 'Marsh'), (3, 'Marzipan'), (3, 'Mastodon'), (3, 'Meadow'), (3, 'Medal'),
  (3, 'Meerkat'), (3, 'Melody'), (3, 'Melon'), (3, 'Merganser'), (3, 'Mermaid'), (3, 'Mesa'), (3, 'Meteor'), (3, 'Minnow'),
  (3, 'Mitten'), (3, 'Mole'), (3, 'Mongoose'), (3, 'Monkey'), (3, 'Moon'), (3, 'Moonbeam'), (3, 'Moose'), (3, 'Mosaic'),
  (3, 'Moss'), (3, 'Moth'), (3, 'Mouse'), (3, 'Muffin'), (3, 'Mug'), (3, 'Mule'), (3, 'Mural'), (3, 'Mushroom'),
  (3, 'Muskrat'), (3, 'Mystery'), (3, 'Napkin'), (3, 'Narwhal'), (3, 'Nebula'), (3, 'Newt'), (3, 'Nightjar'), (3, 'Noodle'),
  (3, 'Notebook'), (3, 'Nougat'), (3, 'Nugget'), (3, 'Numbat'), (3, 'Nuthatch'), (3, 'Oak'), (3, 'Oar'), (3, 'Oasis'),
  (3, 'Oboe'), (3, 'Ocarina'), (3, 'Ocelot'), (3, 'Octopus'), (3, 'Odyssey'), (3, 'Okapi'), (3, 'Opal'), (3, 'Opossum'),
  (3, 'Orbit'), (3, 'Orca'), (3, 'Orchard'), (3, 'Orchid'), (3, 'Origami'), (3, 'Oriole'), (3, 'Oryx'), (3, 'Osprey'),
  (3, 'Ostrich'), (3, 'Otter'), (3, 'Owl'), (3, 'Oyster'), (3, 'Package'), (3, 'Painter'), (3, 'Pancake'), (3, 'Panda'),
  (3, 'Pangolin'), (3, 'Panther'), (3, 'Papaya'), (3, 'Parakeet'), (3, 'Parcel'), (3, 'Parrot'), (3, 'Partridge'), (3, 'Peach'),
  (3, 'Peacock'), (3, 'Pear'), (3, 'Pearl'), (3, 'Pebble'), (3, 'Pedal'), (3, 'Pelican'), (3, 'Pencil'), (3, 'Penguin'),
  (3, 'Pennant'), (3, 'Pepper'), (3, 'Perch'), (3, 'Petal'), (3, 'Petrel'), (3, 'Pheasant'), (3, 'Phoenix'), (3, 'Piano'),
  (3, 'Pickle'), (3, 'Pigeon'), (3, 'Piglet'), (3, 'Pika'), (3, 'Pillow'), (3, 'Pilot'), (3, 'Pine'), (3, 'Pineapple'),
  (3, 'Pioneer'), (3, 'Piper'), (3, 'Pipit'), (3, 'Piranha'), (3, 'Pirate'), (3, 'Pitcher'), (3, 'Pixie'), (3, 'Planet'),
  (3, 'Plateau'), (3, 'Platypus'), (3, 'Plover'), (3, 'Plum'), (3, 'Poem'), (3, 'Pollock'), (3, 'Pond'), (3, 'Pony'),
  (3, 'Poppy'), (3, 'Porpoise'), (3, 'Possum'), (3, 'Postcard'), (3, 'Pottery'), (3, 'Prairie'), (3, 'Praline'), (3, 'Pretzel'),
  (3, 'Prism'), (3, 'Ptarmigan'), (3, 'Pudding'), (3, 'Puddle'), (3, 'Puffin'), (3, 'Puma'), (3, 'Pumpkin'), (3, 'Pup'),
  (3, 'Puppy'), (3, 'Puzzle'), (3, 'Quail'), (3, 'Quartz'), (3, 'Quest'), (3, 'Quetzal'), (3, 'Quilt'), (3, 'Quokka'),
  (3, 'Quoll'), (3, 'Rabbit'), (3, 'Raccoon'), (3, 'Racer'), (3, 'Radish'), (3, 'Raft'), (3, 'Rainbow'), (3, 'Raincoat'),
  (3, 'Raindrop'), (3, 'Rainstorm'), (3, 'Ram'), (3, 'Ranger'), (3, 'Rapids'), (3, 'Raptor'), (3, 'Raven'), (3, 'Recycler'),
  (3, 'Redstart'), (3, 'Reedbuck'), (3, 'Reef'), (3, 'Reindeer'), (3, 'Rhythm'), (3, 'Ribbon'), (3, 'Riddle'), (3, 'Ridge'),
  (3, 'River'), (3, 'Robin'), (3, 'Rocket'), (3, 'Roller'), (3, 'Rooster'), (3, 'Ruby'), (3, 'Sail'), (3, 'Sailboat'),
  (3, 'Sailor'), (3, 'Salmon'), (3, 'Sandal'), (3, 'Sandpiper'), (3, 'Sapling'), (3, 'Sapphire'), (3, 'Sardine'), (3, 'Saucer'),
  (3, 'Savanna'), (3, 'Scallop'), (3, 'Scarf'), (3, 'Scooter'), (3, 'Scout'), (3, 'Seagull'), (3, 'Seahorse'), (3, 'Seal'),
  (3, 'Seashell'), (3, 'Seed'), (3, 'Seedling'), (3, 'Sheep'), (3, 'Shell'), (3, 'Shrike'), (3, 'Shrimp'), (3, 'Sifaka'),
  (3, 'Signpost'), (3, 'Singer'), (3, 'Siskin'), (3, 'Skater'), (3, 'Sketch'), (3, 'Skillet'), (3, 'Skink'), (3, 'Skipper'),
  (3, 'Skunk'), (3, 'Skylark'), (3, 'Sloth'), (3, 'Snail'), (3, 'Sneaker'), (3, 'Snipe'), (3, 'Snowdrift'), (3, 'Snowflake'),
  (3, 'Snowman'), (3, 'Sonnet'), (3, 'Sorter'), (3, 'Sparrow'), (3, 'Spider'), (3, 'Spinner'), (3, 'Spoon'), (3, 'Springbok'),
  (3, 'Sprinter'), (3, 'Sprocket'), (3, 'Sprout'), (3, 'Squid'), (3, 'Squirrel'), (3, 'Stamp'), (3, 'Star'), (3, 'Stardust'),
  (3, 'Starfish'), (3, 'Starfruit'), (3, 'Starling'), (3, 'Stingray'), (3, 'Stork'), (3, 'Story'), (3, 'Stream'), (3, 'Sturgeon'),
  (3, 'Summit'), (3, 'Sunbeam'), (3, 'Sunbird'), (3, 'Sunflower'), (3, 'Sunrise'), (3, 'Surfer'), (3, 'Swallow'), (3, 'Swan'),
  (3, 'Swordfish'), (3, 'Tadpole'), (3, 'Tamarin'), (3, 'Tanager'), (3, 'Tangerine'), (3, 'Tapir'), (3, 'Tarsier'), (3, 'Teacup'),
  (3, 'Teapot'), (3, 'Telescope'), (3, 'Tenrec'), (3, 'Tent'), (3, 'Tern'), (3, 'Thinker'), (3, 'Thrush'), (3, 'Tiger'),
  (3, 'Toad'), (3, 'Toaster'), (3, 'Toffee'), (3, 'Topaz'), (3, 'Tortoise'), (3, 'Toucan'), (3, 'Tower'), (3, 'Towhee'),
  (3, 'Tram'), (3, 'Treasure'), (3, 'Treehouse'), (3, 'Trolley'), (3, 'Trophy'), (3, 'Trout'), (3, 'Truffle'), (3, 'Trumpet'),
  (3, 'Tuatara'), (3, 'Tuba'), (3, 'Tulip'), (3, 'Tuna'), (3, 'Tundra'), (3, 'Turkey'), (3, 'Turnip'), (3, 'Turtle'),
  (3, 'Twirler'), (3, 'Ukulele'), (3, 'Umbrella'), (3, 'Unicorn'), (3, 'Upcycler'), (3, 'Valley'), (3, 'Viceroy'), (3, 'Vicuna'),
  (3, 'Vine'), (3, 'Violin'), (3, 'Vireo'), (3, 'Vole'), (3, 'Voyage'), (3, 'Voyager'), (3, 'Waffle'), (3, 'Wagon'),
  (3, 'Wallaby'), (3, 'Walrus'), (3, 'Wanderer'), (3, 'Wapiti'), (3, 'Warbler'), (3, 'Waterfall'), (3, 'Waxwing'), (3, 'Weasel'),
  (3, 'Whale'), (3, 'Wheel'), (3, 'Whimbrel'), (3, 'Whippet'), (3, 'Whisk'), (3, 'Whistle'), (3, 'Willow'), (3, 'Windmill'),
  (3, 'Wizard'), (3, 'Wolf'), (3, 'Wombat'), (3, 'Wrapper'), (3, 'Wrasse'), (3, 'Wren'), (3, 'Xylophone'), (3, 'Yak'),
  (3, 'Yeti'), (3, 'Zebra'), (3, 'Zebu'), (3, 'Zinnia');

-- ---------------------------------------------------------------------------
-- Room for three words (longest: nine letters x 3 + two spaces = 29)
-- ---------------------------------------------------------------------------

alter table public.players drop constraint players_name_shape;
alter table public.players
  add constraint players_name_shape check (char_length(name) between 2 and 29 and name ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]*$');

-- ---------------------------------------------------------------------------
-- Is this a rolled name?
-- ---------------------------------------------------------------------------

create or replace function public.is_rolled_name(p_name text)
returns boolean
language sql stable security definer set search_path = public as $$
  with parts as (select string_to_array(coalesce(p_name, ''), ' ') as p)
  select coalesce(array_length(p, 1), 0) = 3
     and (
       select count(*) from public.name_words w
       where (w.slot = 1 and w.word = p[1]) or (w.slot = 2 and w.word = p[2]) or (w.slot = 3 and w.word = p[3])
     ) = 3
  from parts;
$$;

-- Only set_player (which runs as the owner) calls it.
revoke execute on function public.is_rolled_name(text) from public;

-- ---------------------------------------------------------------------------
-- set_player: new names must be rolled
-- ---------------------------------------------------------------------------

create or replace function public.set_player(p_name text, p_paint text default 'green')
returns table (name text, paint text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_paint text := coalesce(p_paint, 'green');
  v_old players%rowtype;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  select * into v_old from players pl where pl.id = v_uid for update;
  -- Keeping the name you already have (only changing paint) is always fine; anything new must be rolled.
  if (not found or v_old.name is distinct from v_name) and not public.is_rolled_name(v_name) then
    raise exception 'Names are rolled: three words from the lists' using errcode = '22023';
  end if;
  if found and v_old.name is distinct from v_name and v_old.renamed_at > now() - interval '1 hour' then
    raise exception 'You can change your name once an hour' using errcode = '53400';
  end if;
  insert into players as pl (id, name, paint) values (v_uid, v_name, v_paint)
  on conflict (id) do update
    set name = excluded.name,
        paint = excluded.paint,
        renamed_at = case when pl.name is distinct from excluded.name then now() else pl.renamed_at end;
  return query select pl.name, pl.paint from players pl where pl.id = v_uid;
end;
$$;
