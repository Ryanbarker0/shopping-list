import { describe, expect, it } from 'vitest'
import { categorise, itemKey, singularWords } from './categorise'

describe('singularWords', () => {
  it.each([
    ['Chicken Breasts', ['chicken', 'breast']],
    ['tomatoes', ['tomato']],
    ['cherries', ['cherry']],
    ['loaves', ['loaf']],
    ['peaches', ['peach']],
    ['hummus', ['hummus']],
    ['asparagus', ['asparagus']],
    ['brussels sprouts', ['brussels', 'sprout']],
    ['crisps', ['crisp']],
    ['eggs', ['egg']],
    ['  Semi-skimmed   milk! ', ['semi', 'skimmed', 'milk']],
    ["goat's cheese", ['goat', 'cheese']],
    ['chillies', ['chilli']],
    ['cookies', ['cookie']],
    ['olives', ['olive']],
    ['pies', ['pie']],
    ['chives', ['chive']],
  ])('singularises "%s"', (text, words) => {
    expect(singularWords(text)).toEqual(words)
  })
})

describe('categorise', () => {
  it.each([
    ['onions', 'fruit-veg'],
    ['Red onions', 'fruit-veg'],
    ['chicken breasts', 'meat-fish'],
    ['free range chicken breast fillets', 'meat-fish'],
    ['turkey mince', 'meat-fish'],
    ['semi skimmed milk', 'dairy-eggs'],
    ['Milk', 'dairy-eggs'],
    ['chocolate milk', 'dairy-eggs'],
    ['milk chocolate', 'snacks'],
    ['eggs', 'dairy-eggs'],
    ['bread', 'bakery'],
    ['sourdough loaf', 'bakery'],
    ['chopped tomatoes', 'pantry'],
    ['tin of chopped tomatoes', 'pantry'],
    ['tinned peaches', 'pantry'],
    ['frozen peas', 'frozen'],
    ['peas', 'fruit-veg'],
    ['fish fingers', 'frozen'],
    ['washing up liquid', 'household'],
    ['toilet roll', 'household'],
    ['toothpaste', 'health'],
    ['cat food', 'baby-pet'],
    ['orange juice', 'drinks'],
    ['oranges', 'fruit-veg'],
    ['salt and vinegar crisps', 'snacks'],
    ['Cheddar', 'dairy-eggs'],
    ['hummus', 'chilled'],
    ['houmous', 'chilled'],
    ['spaghetti', 'pantry'],
    ['ice cream', 'frozen'],
    ['sweet potatoes', 'fruit-veg'],
    ['sparkling water', 'drinks'],
    ['beans', 'pantry'],
    ['cherry bakewells', 'snacks'],
    ['salad dressing', 'pantry'],
    ['salad cream', 'pantry'],
    ['pork pies', 'chilled'],
    ['squash', 'drinks'],
    ["Ben & Jerry's", 'frozen'],
    ['something nobody has heard of', 'other'],
    ['', 'other'],
  ])('puts "%s" in %s', (name, category) => {
    expect(categorise(name)).toBe(category)
  })

  it('prefers an override made by the person', () => {
    expect(categorise('Oat milk', { [itemKey('oat milk')]: 'drinks' })).toBe('drinks')
    expect(categorise('oat milks', { [itemKey('Oat Milk')]: 'drinks' })).toBe('drinks')
    expect(categorise('oat milk', {})).toBe('dairy-eggs')
  })

  it('keys overrides by the singular normalised name', () => {
    expect(itemKey('Chicken Breasts!')).toBe('chicken breast')
  })
})
