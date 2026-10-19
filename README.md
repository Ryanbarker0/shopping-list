# Shopping List

A shopping list for the phone, with no adverts and nothing to upgrade to.
Type the list at home one line at a time, press Start Shop, and the items are sorted into supermarket sections to tick off as you go round.

## How it works

- **Plan.** The list starts blank.
  Type an item and press Enter to go to the next line.
  While typing, suggestions appear underneath from a built-in catalog of everyday groceries and from things you have bought before; tap one to use it, or just keep typing.
  Quantities and weights go on the same line and are understood: `onions x3`, `chicken breasts 400g`, `1kg turkey mince`, `2 x 400g chopped tomatoes`, `6 eggs`.
  Backspace on an empty line removes it, and pasting several lines of text adds a line per item.
- **Shop.** Start Shop sorts the list into sections in the order a supermarket is usually walked: fruit and veg, bakery, meat and fish, dairy and eggs, chilled, pantry, snacks, drinks, frozen, household, health and beauty, baby and pet.
  Tick items off as they go in the trolley; a bar at the top shows how far round you are.
  Anything the app put in the wrong section can be moved with the small control at the end of its row, and the choice is remembered for next time.
  Edit list goes back to the plan without losing ticks.
- **Clean up** empties the list ready for next time.
  It asks first if anything is still unticked.

Everything is kept on the device in local storage: the current list, what has been ticked, past item names for suggestions, and section choices.
Nothing is sent anywhere.
The app installs to the home screen and works offline.

## How items are sorted

`src/lib/catalog.ts` lists a few hundred common UK grocery items by section.
`src/lib/categorise.ts` lower-cases and singularises what was typed, then looks for the longest phrase of it the catalog knows, preferring the later phrase when two are the same length because the head noun comes last in English.
So "free range chicken breast fillets" matches "chicken breast", "chocolate milk" is dairy and "milk chocolate" is a snack.
A word such as "frozen" or "tinned" anywhere in the name sends the item to that section regardless.
Anything unrecognised lands in Other, where it can be moved by hand.

Quantities are parsed by `src/lib/parseLine.ts`, which understands counts (`x3`, `3x`, a bare leading or trailing number) and measures (`400g`, `1.5kg`, `2l`, `500ml`, `2 tins`, `6 pack`, `1 loaf`) at either end of the line, alone or together.

## Running locally

```sh
nvm use
npm install
npm run dev
```

Other scripts:

```sh
npm test          # unit and app tests (vitest)
npm run lint      # oxlint
npm run format    # prettier
npm run build     # type-check and production build
```

## Deployment

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`.
The workflow runs lint, format check, tests and the build before deploying.
The Vite base path is set from the repository name at build time.

On a phone, open the deployed URL in Safari and use Share, then Add to Home Screen.
The app installs as a standalone PWA and updates itself on the next launch after a deploy.

## Project layout

- `src/lib/parseLine.ts` splits a typed line into a name and quantity.
- `src/lib/categories.ts` names the sections and their walking order.
- `src/lib/catalog.ts` is the item catalog; `src/lib/categorise.ts` matches names against it.
- `src/lib/suggest.ts` ranks suggestions from history and the catalog.
- `src/lib/shop.ts` turns lines into grouped checklist items.
- `src/lib/storage.ts` is the saved shape and its local storage load and save.
- `src/state/useShoppingList.ts` is the reducer behind both screens.
- `src/components/` holds the plan screen, the shop screen and their parts.
