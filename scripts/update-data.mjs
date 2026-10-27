// Downloads Warframe's Public Export (https://warframe.fandom.com/wiki/Public_Export)
// and reduces it to the small JSON file the app loads: public/data/warframe-data.json
//
// Run with: npm run update-data
//
// How the export links together:
//   relic reward  "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/AshPrimeHelmetBlueprint"
//     -> drop "/StoreItems" to get a recipe uniqueName in ExportRecipes
//     -> recipe.resultType is a component ("...AshPrimeHelmetComponent", named in ExportResources)
//     -> the component is an ingredient of the main recipe whose resultType is the warframe/weapon.
//   Weapon parts ("...WeaponParts/BratonPrimeBarrel") skip the first step: the reward *is* the component.
//   Main blueprints ("...VectisPrimeBlueprint") have the gear itself as their resultType.
//
// The export has no "vaulted" flag, so we also read DE's official drop tables: any relic that
// shows up as a drop somewhere (missions, bounties, ...) is currently obtainable.

import { mkdir, writeFile } from 'node:fs/promises';
import lzma from 'lzma';

const INDEX_URL = 'https://origin.warframe.com/PublicExport/index_en.txt.lzma';
const MANIFEST_URL = 'https://content.warframe.com/PublicExport/Manifest/';
const DROP_TABLES_URL =
  'https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html';
const OUTPUT_DIR = new URL('../public/data/', import.meta.url);

// Items whose export names are internal-sounding.
const NAME_OVERRIDES = {
  '/Lotus/Upgrades/Skins/Kubrows/Collars/PrimeKubrowCollarA': 'Kavasa Prime Kubrow Collar',
};
const CATEGORY_OVERRIDES = {
  '/Lotus/Upgrades/Skins/Kubrows/Collars/PrimeKubrowCollarA': 'Companion',
};

const TIERS = ['Lith', 'Meso', 'Neo', 'Axi'];

// productCategory values from the export -> labels shown in the app.
const CATEGORIES = {
  Suits: 'Warframe',
  SpaceSuits: 'Archwing',
  MechSuits: 'Necramech',
  LongGuns: 'Primary',
  Pistols: 'Secondary',
  Melee: 'Melee',
  SpaceGuns: 'Archwing',
  SpaceMelee: 'Archwing',
  Sentinels: 'Companion',
  KubrowPets: 'Companion',
  SpecialItems: 'Companion',
  SentinelWeapons: 'Companion',
};

async function fetchIndex() {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`Index download failed: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const text = await new Promise((resolve, reject) =>
    lzma.decompress(bytes, (result, err) => (err ? reject(err) : resolve(result))),
  );
  // Lines look like "ExportRecipes_en.json!00_oac+LCAtIyqDxZF8Qe1ZZA"
  return text.split(/\r?\n/).filter(Boolean);
}

async function fetchExport(index, name) {
  const entry = index.find((line) => line.startsWith(`${name}_en.json`));
  if (!entry) throw new Error(`${name} not found in index`);
  const res = await fetch(MANIFEST_URL + entry);
  if (!res.ok) throw new Error(`${name} download failed: ${res.status}`);
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    // The export has historically contained raw control characters inside strings.
    return JSON.parse(raw.replace(/[\u0000-\u001f]/g, ' '));
  }
}

// Returns the set of relic ids ("Lith A1") that currently drop, or null if the tables are unavailable.
async function fetchUnvaultedRelics() {
  try {
    const res = await fetch(DROP_TABLES_URL);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    const unvaulted = new Set();
    for (const section of html.split('<h3 id="').slice(1)) {
      // This section lists what's *inside* every relic, vaulted or not.
      if (section.startsWith('relicRewards')) continue;
      for (const m of section.matchAll(/\b(Lith|Meso|Neo|Axi) ([A-Z]\d+) Relic/g)) {
        unvaulted.add(`${m[1]} ${m[2]}`);
      }
    }
    return unvaulted;
  } catch (err) {
    console.warn(`Could not read drop tables (${err.message}); vaulted status will be missing.`);
    return null;
  }
}

const lastSegment = (path) => path.slice(path.lastIndexOf('/') + 1);
// "FormaBlueprint" -> "Forma Blueprint"
const humanize = (s) => s.replace(/([a-z])([A-Z])/g, '$1 $2');
const toTitleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function main() {
  console.log('Downloading index...');
  const index = await fetchIndex();

  console.log('Downloading exports...');
  const [relicArcane, recipes, resources, warframes, weapons, sentinels, unvaulted] =
    await Promise.all([
      fetchExport(index, 'ExportRelicArcane'),
      fetchExport(index, 'ExportRecipes'),
      fetchExport(index, 'ExportResources'),
      fetchExport(index, 'ExportWarframes'),
      fetchExport(index, 'ExportWeapons'),
      fetchExport(index, 'ExportSentinels'),
      fetchUnvaultedRelics(),
    ]);

  const gearList = [
    ...warframes.ExportWarframes,
    ...weapons.ExportWeapons,
    ...sentinels.ExportSentinels,
  ];
  const gear = new Map(gearList.map((g) => [g.uniqueName, g]));
  const names = new Map(
    [...resources.ExportResources, ...gearList].map((x) => [x.uniqueName, x.name]),
  );
  const recipesByName = new Map(recipes.ExportRecipes.map((r) => [r.uniqueName, r]));

  // component uniqueName -> the recipe that consumes it (preferring recipes that build gear)
  const consumedBy = new Map();
  for (const recipe of recipes.ExportRecipes) {
    for (const ing of recipe.ingredients) {
      const existing = consumedBy.get(ing.ItemType);
      if (!existing || (!gear.has(existing.resultType) && gear.has(recipe.resultType))) {
        consumedBy.set(ing.ItemType, recipe);
      }
    }
  }

  const items = new Map(); // gear uniqueName -> { id, name, category, parts: Map }

  function getItem(id) {
    let item = items.get(id);
    if (!item) {
      const g = gear.get(id);
      let name = NAME_OVERRIDES[id] ?? g?.name ?? names.get(id) ?? humanize(lastSegment(id));
      name = name.replace(/^<[A-Z]+> /, ''); // "<ARCHWING> Odonata Prime"
      item = {
        id,
        name: name === name.toUpperCase() ? toTitleCase(name) : name,
        category: CATEGORY_OVERRIDES[id] ?? CATEGORIES[g?.productCategory] ?? 'Other',
        parts: new Map(),
      };
      items.set(id, item);
    }
    return item;
  }

  // Works out which prime item (and which part of it) a relic reward is. Returns null for
  // rewards that aren't gear parts (e.g. Forma Blueprint).
  function resolvePart(partId) {
    // Only prime gear is tracked; this also keeps Forma (an ingredient in many recipes) out.
    if (!partId.includes('Prime')) return null;

    const recipe = recipesByName.get(partId);
    // A blueprint whose result isn't used in any other recipe is the item's main blueprint.
    if (recipe && (gear.has(recipe.resultType) || !consumedBy.has(recipe.resultType))) {
      return { item: getItem(recipe.resultType), partName: 'Blueprint', count: 1 };
    }
    const component = recipe ? recipe.resultType : partId;
    const parent = consumedBy.get(component);
    if (!parent) return null;

    const item = getItem(parent.resultType);
    const count = parent.ingredients.find((i) => i.ItemType === component).ItemCount;
    let partName = names.get(component) ?? humanize(lastSegment(component));
    partName = partName.replace(/^.*Prime /, ''); // "Saryn Prime Neuroptics" -> "Neuroptics"
    if (recipe) partName += ' Blueprint';
    return { item, partName, count };
  }

  const relics = new Map();
  for (const entry of relicArcane.ExportRelicArcane) {
    if (!entry.relicRewards) continue; // arcanes live in the same file
    const [tier, code] = entry.name.replace(/ Relic$/, '').split(' ');
    if (!TIERS.includes(tier)) continue; // e.g. Requiem relics
    const id = `${tier} ${code}`;
    // Each relic appears once per refinement (Intact/Exceptional/...) with identical rewards.
    if (relics.has(id)) continue;

    const rewards = entry.relicRewards.map((reward) => {
      const partId = reward.rewardName.replace('/StoreItems', '');
      const rarity = reward.rarity.toLowerCase();
      const resolved = resolvePart(partId);
      if (!resolved) {
        const name = names.get(partId) ?? humanize(lastSegment(partId));
        return { name, rarity };
      }
      const { item, partName, count } = resolved;
      if (!item.parts.has(partId)) item.parts.set(partId, { id: partId, name: partName, count });
      return { name: `${item.name} ${partName}`, rarity, partId };
    });

    relics.set(id, { id, tier, code, vaulted: unvaulted ? !unvaulted.has(id) : false, rewards });
  }

  const naturalCompare = new Intl.Collator('en', { numeric: true }).compare;
  const output = {
    generatedAt: new Date().toISOString(),
    relics: [...relics.values()].sort(
      (a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || naturalCompare(a.code, b.code),
    ),
    items: [...items.values()]
      .map((item) => ({
        ...item,
        parts: [...item.parts.values()].sort((a, b) =>
          // Blueprint first, then alphabetical
          a.name === 'Blueprint' ? -1 : b.name === 'Blueprint' ? 1 : naturalCompare(a.name, b.name),
        ),
      }))
      .sort((a, b) => naturalCompare(a.name, b.name)),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  const outFile = new URL('warframe-data.json', OUTPUT_DIR);
  await writeFile(outFile, JSON.stringify(output));
  console.log(`Wrote ${output.relics.length} relics and ${output.items.length} prime items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
