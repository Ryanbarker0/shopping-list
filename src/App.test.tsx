import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function itemInputs() {
  return screen.getAllByRole('textbox', { name: 'Item' })
}

describe('App', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('plans a list line by line, shops it by section, and cleans up', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(itemInputs()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Start Shop' })).toBeDisabled()

    await user.type(itemInputs()[0], 'onions x3{Enter}')
    expect(itemInputs()).toHaveLength(2)
    expect(itemInputs()[1]).toHaveFocus()
    expect(screen.getByText('×3')).toBeInTheDocument()

    await user.type(itemInputs()[1], 'chicken breasts 400g{Enter}')
    await user.type(itemInputs()[2], '1kg turkey mince{Enter}')
    await user.type(itemInputs()[3], 'milk{Enter}')
    await user.type(itemInputs()[4], 'washing up liquid')
    expect(screen.getByText('5 items')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start Shop' }))

    const sections = screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'))
    expect(sections).toEqual([
      'group-fruit-veg',
      'group-meat-fish',
      'group-dairy-eggs',
      'group-household',
    ])

    const meat = screen.getByRole('region', { name: /Meat & Fish/ })
    expect(within(meat).getByText('chicken breasts')).toBeInTheDocument()
    expect(within(meat).getByText('400g')).toBeInTheDocument()
    expect(within(meat).getByText('turkey mince')).toBeInTheDocument()
    expect(within(meat).getByText('1kg')).toBeInTheDocument()
    expect(screen.getByText('0 of 5 picked up')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /onions/ }))
    expect(screen.getByRole('checkbox', { name: /onions/ })).toBeChecked()
    expect(screen.getByText('1 of 5 picked up')).toBeInTheDocument()

    // Finishing with items left asks first.
    await user.click(screen.getByRole('button', { name: 'Clean up' }))
    expect(screen.getByRole('button', { name: 'Finish with 4 left?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Finish with 4 left?' }))

    expect(itemInputs()).toHaveLength(1)
    expect(itemInputs()[0]).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Start Shop' })).toBeDisabled()
  })

  it('offers suggestions while typing and fills the line when one is tapped', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(itemInputs()[0], 'chick x2')
    const suggestions = screen.getByRole('group', { name: 'Suggestions' })
    await user.click(within(suggestions).getByRole('button', { name: 'Chicken breast' }))
    expect(itemInputs()[0]).toHaveValue('Chicken breast x2')
    expect(itemInputs()[0]).toHaveFocus()
  })

  it('suggests things bought before ahead of the catalog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(itemInputs()[0], 'Cherry bakewells')
    await user.click(screen.getByRole('button', { name: 'Start Shop' }))
    await user.click(screen.getByRole('button', { name: 'Clean up' }))
    await user.click(screen.getByRole('button', { name: 'Finish with 1 left?' }))

    await user.type(itemInputs()[0], 'cher')
    const suggestions = screen.getByRole('group', { name: 'Suggestions' })
    expect(within(suggestions).getAllByRole('button')[0]).toHaveTextContent('Cherry bakewells')
  })

  it('keeps ticks when going back to edit, and remembers a moved item', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(itemInputs()[0], 'oat milk{Enter}')
    await user.type(itemInputs()[1], 'bread')
    await user.click(screen.getByRole('button', { name: 'Start Shop' }))
    await user.click(screen.getByRole('checkbox', { name: /bread/ }))

    expect(screen.getByRole('region', { name: /Dairy & Eggs/ })).toBeInTheDocument()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Section for oat milk' }),
      'drinks',
    )
    expect(
      within(screen.getByRole('region', { name: /Drinks/ })).getByText('oat milk'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit list' }))
    expect(itemInputs().map((i) => (i as HTMLInputElement).value)).toEqual([
      'oat milk',
      'bread',
      '',
    ])
    await user.type(itemInputs()[2], 'eggs')
    await user.click(screen.getByRole('button', { name: 'Start Shop' }))
    expect(screen.getByRole('checkbox', { name: /bread/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /eggs/ })).not.toBeChecked()
    expect(
      within(screen.getByRole('region', { name: /Drinks/ })).getByText('oat milk'),
    ).toBeInTheDocument()
  })

  it('removes an empty line with backspace and a filled one with its button', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(itemInputs()[0], 'milk{Enter}')
    expect(itemInputs()).toHaveLength(2)
    await user.keyboard('{Backspace}')
    expect(itemInputs()).toHaveLength(1)
    expect(itemInputs()[0]).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Remove milk' }))
    expect(itemInputs()).toHaveLength(1)
    expect(itemInputs()[0]).toHaveValue('')
  })

  it('splits pasted text over several lines', () => {
    render(<App />)
    const input = itemInputs()[0]
    fireEvent.paste(input, { clipboardData: { getData: () => '- milk\n- eggs x6\n\nbread\n' } })
    expect(itemInputs().map((i) => (i as HTMLInputElement).value)).toEqual([
      'milk',
      'eggs x6',
      'bread',
    ])
  })

  it('comes back where it left off after a reload', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.type(itemInputs()[0], 'milk')
    await user.click(screen.getByRole('button', { name: 'Start Shop' }))
    await user.click(screen.getByRole('checkbox', { name: /milk/ }))
    first.unmount()

    render(<App />)
    expect(screen.getByRole('checkbox', { name: /milk/ })).toBeChecked()
    expect(screen.getByText('All done')).toBeInTheDocument()
  })
})
