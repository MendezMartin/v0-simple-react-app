"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CalendarDays } from "lucide-react"

// Define the initial state for modifiers (global defaults)
const initialModifiersState = {
  applyStandardTrimDiscount: false,
  addAccountWithMarkup: false,
  applyNextPricing: false,
  overrideUnitPrice: false,
  overrideUnitCost: false,
}

// Define the initial state for override values (global defaults)
const initialOverrideValuesState = {
  unitPrice: "",
  unitCost: "",
}

// Define the available items with their base prices
const availableItems = [
  { id: "RA6BI", baseUnitCost: 5.208, baseManufacturingCost: 0 },
  { id: "PP6GR", baseUnitCost: 4.8745, baseManufacturingCost: 2.40 },
  { id: "BTR", baseUnitCost: 11.4834, baseManufacturingCost: 6.08 },
]

export default function PriceCheckApp() {
  const [itemId, setItemId] = useState("")
  const [selectedActor, setSelectedActor] = useState<string | null>(null)

  // Global states for modifiers and override values - these persist across actor changes
  const [modifiers, setModifiers] = useState(initialModifiersState)
  const [overrideValues, setOverrideValues] = useState(initialOverrideValuesState)

  const [results, setResults] = useState<{
    manufacturingCost: string
    unitCost: string
    unitPrice: string
  } | null>(null)

  // Add state to track current item and validation
  const [currentItem, setCurrentItem] = useState<typeof availableItems[0] | null>(null)
  const [isValidItem, setIsValidItem] = useState(false)

  // Derived modifiers and override values for UI display and calculation
  // These reflect the global state, potentially adjusted by actor-specific rules
  const derivedModifiers = { ...modifiers }
  const derivedOverrideValues = { ...overrideValues }

  // Apply actor-specific overrides to the derived states for calculation and UI display
  if (selectedActor === "account") {
    derivedModifiers.addAccountWithMarkup = true // Account user always has markup on
  }

  // Function to validate and find item
  const validateAndFindItem = (itemId: string) => {
    const foundItem = availableItems.find(item => item.id.toLowerCase() === itemId.trim().toLowerCase())
    setIsValidItem(!!foundItem)
    setCurrentItem(foundItem || null)
    return foundItem
  }

  // Function to check if item is valid (for immediate use)
  const isItemValid = (itemId: string) => {
    return availableItems.some(item => item.id.toLowerCase() === itemId.trim().toLowerCase())
  }

  useEffect(() => {
    // This effect runs when selectedActor or any part of the global modifiers/overrideValues changes.
    // It triggers the price calculation to update the results.
    // Note: itemId is intentionally excluded to prevent recalculation while typing
    handleCheckPrice()
  }, [modifiers, overrideValues]) // Removed itemId from dependencies

  // Separate effect to clear results when Item ID changes
  useEffect(() => {
    // Clear results when Item ID changes, forcing user to click "Check Price" for new results
    setResults(null)
    // Note: We don't clear currentItem and isValidItem here anymore
    // as they should be managed by the onChange handler
  }, [itemId])

  // Reset modifiers to defaults when results are null
  useEffect(() => {
    if (results === null) {
      setModifiers(initialModifiersState)
      setOverrideValues(initialOverrideValuesState)
    }
  }, [results])

  const handleModifierChange = (modifier: keyof typeof initialModifiersState) => {
    // Update the global modifiers state
    setModifiers((prev) => {
      const newModifiers = {
        ...prev,
        [modifier]: !prev[modifier],
      }

      // Specific logic for addAccountWithMarkup affecting overrideUnitPrice
      // This logic applies to the global state
      if (modifier === "addAccountWithMarkup" && !newModifiers.addAccountWithMarkup) {
        setOverrideValues((prevOverrides) => ({ ...prevOverrides, unitPrice: "" })) // Clear override value globally
        newModifiers.overrideUnitPrice = false // Uncheck override unit price globally
      }

      return newModifiers
    })
  }

  const handleActorChange = (actor: string) => {
    // Only update the selected actor. Modifiers and override values persist globally.
    setSelectedActor(actor)
  }

  const handleApplyNextPricingClick = () => {
    // Update global modifiers and override values
    setModifiers((prev) => ({
      ...prev,
      applyNextPricing: true,
      overrideUnitCost: false, // Uncheck override unit cost globally
    }))
    setOverrideValues((prev) => ({ ...prev, unitCost: "" })) // Clear override unit cost value globally
  }

  const handleReset = () => {
    setItemId("")
    setResults(null) // Explicitly clear results on reset
    setSelectedActor(null) // Clear selected actor
    setCurrentItem(null) // Clear current item
    setIsValidItem(false) // Clear validation state

    // Reset global modifiers and override values to their initial defaults
    setModifiers(initialModifiersState)
    setOverrideValues(initialOverrideValuesState)
  }

  const handleCheckPrice = () => {
    // If no item ID or no actor selected, clear results and stop.
    if (!itemId.trim() || !selectedActor) {
      setResults(null)
      return
    }

    // Validate the item first
    const foundItem = validateAndFindItem(itemId)
    if (!foundItem) {
      setResults(null)
      return
    }

    // Use the found item's base prices
    const initialBaseUnitCost = foundItem.baseUnitCost
    const initialManufacturingCost = foundItem.baseManufacturingCost

    let currentManufacturingCost = initialManufacturingCost
    let calculatedUnitCost = initialBaseUnitCost // This will be the base for unit cost and unit price calculations

    // 1. Apply 'Apply next pricing' using derived modifiers
    if (derivedModifiers.applyNextPricing) {
      currentManufacturingCost += 3.0 // Apply to manufacturing cost
      calculatedUnitCost += 8.0 // Apply to calculated unit cost
    }

    // 2. Apply 'Apply standard trim discount' to calculatedUnitCost, unless overrideUnitCost is active
    let discountedCalculatedUnitCost = calculatedUnitCost
    if (derivedModifiers.applyStandardTrimDiscount) {
      if (!(derivedModifiers.overrideUnitCost && derivedOverrideValues.unitCost)) {
        discountedCalculatedUnitCost *= 0.85 // Apply 15% discount
      }
    }

    // 3. Determine finalUnitCost, prioritizing override if active, using derived values
    const finalUnitCost =
      derivedModifiers.overrideUnitCost && derivedOverrideValues.unitCost
        ? Number.parseFloat(derivedOverrideValues.unitCost)
        : discountedCalculatedUnitCost // Use the potentially discounted calculatedUnitCost

    let finalUnitPrice

    // 4. Calculate base unit price for markup, always based on initialBaseUnitCost
    const baseUnitPriceForMarkup = initialBaseUnitCost

    // 5. Logic for finalUnitPrice based on "Add account with markup"
    if (derivedModifiers.addAccountWithMarkup) {
      // If markup is ON, calculate unit price with markup on initialBaseUnitCost
      finalUnitPrice = baseUnitPriceForMarkup * 1.5

      // If markup is ON AND standard trim discount is ON, apply discount to unit price
      // UNLESS unit price is overridden
      if (
        derivedModifiers.applyStandardTrimDiscount &&
        !(derivedModifiers.overrideUnitPrice && derivedOverrideValues.unitPrice)
      ) {
        finalUnitPrice *= 0.85 // Apply 15% discount
      }
    } else {
      // If markup is OFF, unit price always matches finalUnitCost
      // The standard trim discount (if active) would have already been applied to finalUnitCost
      finalUnitPrice = finalUnitCost
    }

    // 6. Finally, apply overrideUnitPrice if it's active (this takes highest precedence)
    if (derivedModifiers.overrideUnitPrice && derivedOverrideValues.unitPrice) {
      finalUnitPrice = Number.parseFloat(derivedOverrideValues.unitPrice)
    }

    setResults({
      manufacturingCost: `$${currentManufacturingCost.toFixed(2)}`,
      unitCost: `$${finalUnitCost.toFixed(2)}`,
      unitPrice: `$${finalUnitPrice.toFixed(2)}`,
    })
  }

  // Determine disabled states for UI elements based on selectedActor and derivedModifiers
  const isItemIdDisabled = !selectedActor
  const isStandardTrimDiscountDisabled = !selectedActor || results === null
  const isAddAccountWithMarkupDisabled = !selectedActor || selectedActor === "account" || selectedActor === "csmUser" || results === null
  const isOverrideUnitCostDisabled = !selectedActor || selectedActor !== "csmUser" || results === null
  const isOverrideUnitPriceDisabled =
    !selectedActor ||
    selectedActor !== "customer" ||
    (selectedActor === "customer" && !derivedModifiers.addAccountWithMarkup) ||
    results === null
  const isApplyNextPricingDisabled = !selectedActor || selectedActor !== "csmUser" || results === null
  const isCheckPriceDisabled = !itemId.trim() || !selectedActor || !isItemValid(itemId)

  const pricingConditions = []
  if (results && currentItem) {
    if (selectedActor === "account") pricingConditions.push("Viewing as an Account user.")
    if (selectedActor === "customer") pricingConditions.push("Viewing as a Customer user.")
    if (selectedActor === "csmUser") pricingConditions.push("Viewing as a CSM user.")

    pricingConditions.push(`Pricing for item: ${currentItem.id}.`)

    if (derivedModifiers.applyStandardTrimDiscount) {
      pricingConditions.push("Standard trim discount applied (15%).")
    }

    if (derivedModifiers.addAccountWithMarkup) {
      pricingConditions.push("Account markup applied (50%).")
    }

    if (derivedModifiers.applyNextPricing) {
      pricingConditions.push("Next pricing rules are active.")
    }

    if (derivedModifiers.overrideUnitCost && derivedOverrideValues.unitCost) {
      pricingConditions.push(`Unit Cost is overridden to $${Number.parseFloat(derivedOverrideValues.unitCost).toFixed(2)}.`)
    }

    if (derivedModifiers.overrideUnitPrice && derivedOverrideValues.unitPrice) {
      pricingConditions.push(`Unit Price is overridden to $${Number.parseFloat(derivedOverrideValues.unitPrice).toFixed(2)}.`)
    }
  }

  // Handler for override input fields to update global overrideValues directly
  const handleOverrideValueChange = (type: "unitPrice" | "unitCost", value: string) => {
    setOverrideValues((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-950 p-4 flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-white text-4xl md:text-5xl font-bold">Pricing rules validator</h1>
      </div>

      {/* Main Content Area: Actors Card + Price Check Card */}
      <div className="flex flex-col lg:flex-row gap-8 max-w-full items-start lg:items-stretch">
        {/* Actors Section (Left Card) */}
        <Card className="bg-white shadow-xl w-full lg:w-72 flex-shrink-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Actor</h3>
            <RadioGroup value={selectedActor || ""} onValueChange={handleActorChange} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="account" id="actorAccount" />
                <Label htmlFor="actorAccount" className="text-sm font-normal">
                  Account user
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="actorCustomer" />
                <Label htmlFor="actorCustomer" className="text-sm font-normal">
                  Customer user
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csmUser" id="actorCsmUser" />
                <Label htmlFor="actorCsmUser" className="text-sm font-normal">
                  CSM user
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Main Price Check Card (Right Card) */}
        <Card className="bg-white shadow-xl w-full lg:max-w-2xl">
          <CardContent className="p-8">
            {/* Input Section */}
            <div className="space-y-6 mb-8">
              <div>
                <Label htmlFor="itemId" className="text-base font-medium text-gray-700 mb-2 block">
                  Item ID
                </Label>
                <Input
                  id="itemId"
                  type="text"
                  value={itemId}
                  onChange={(e) => {
                    setItemId(e.target.value)
                    if (e.target.value.trim()) {
                      validateAndFindItem(e.target.value)
                    } else {
                      setIsValidItem(false)
                      setCurrentItem(null)
                    }
                  }}
                  placeholder="Enter item ID. (RA6BI, PP6GR, BTR)"
                  className={`w-64 ${itemId.trim() && !isItemValid(itemId) ? "border-red-500" : ""}`}
                  disabled={isItemIdDisabled} // Disabled until actor is selected
                />
                {itemId.trim() && !isItemValid(itemId) && (
                  <p className="text-red-500 text-sm mt-1">Invalid Item ID. Please enter RA6BI, PP6GR, or BTR.</p>
                )}
                {isItemValid(itemId) && currentItem && (
                  <p className="text-green-600 text-sm mt-1">✓ Valid item: {currentItem.id}</p>
                )}
              </div>

              {/* Modifiers Section */}
              <div>
                <Label className="text-base font-medium text-gray-700 mb-3 block">Modifiers</Label>
                <div className={`space-y-4 ${!selectedActor || results === null ? "opacity-50" : ""}`}>
                  {/* Row 1: Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="applyStandardTrimDiscount"
                        checked={derivedModifiers.applyStandardTrimDiscount}
                        onCheckedChange={() => handleModifierChange("applyStandardTrimDiscount")}
                        disabled={isStandardTrimDiscountDisabled}
                      />
                      <Label htmlFor="applyStandardTrimDiscount" className="text-sm font-normal">
                        Apply standard trim discount (15%)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="addAccountWithMarkup"
                        checked={derivedModifiers.addAccountWithMarkup} // Use derived state
                        onCheckedChange={() => handleModifierChange("addAccountWithMarkup")}
                        disabled={isAddAccountWithMarkupDisabled}
                      />
                      <Label htmlFor="addAccountWithMarkup" className="text-sm font-normal">
                        Add account with markup (50%)
                      </Label>
                    </div>
                  </div>

                  {/* Row 2: Overrides on one line */}
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overrideUnitCost"
                        checked={derivedModifiers.overrideUnitCost} // Use derived state
                        onCheckedChange={() => handleModifierChange("overrideUnitCost")}
                        disabled={isOverrideUnitCostDisabled}
                      />
                      <Label htmlFor="overrideUnitCost" className="text-sm font-normal">
                        Override unit cost
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={derivedOverrideValues.unitCost} // Use derived state
                        onChange={(e) => handleOverrideValueChange("unitCost", e.target.value)}
                        disabled={isOverrideUnitCostDisabled || !derivedModifiers.overrideUnitCost}
                        className="w-24 ml-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overrideUnitPrice"
                        checked={derivedModifiers.overrideUnitPrice} // Use derived state
                        onCheckedChange={() => handleModifierChange("overrideUnitPrice")}
                        disabled={isOverrideUnitPriceDisabled}
                      />
                      <Label htmlFor="overrideUnitPrice" className="text-sm font-normal">
                        Override unit price
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={derivedOverrideValues.unitPrice} // Use derived state
                        onChange={(e) => handleOverrideValueChange("unitPrice", e.target.value)}
                        disabled={isOverrideUnitPriceDisabled || !derivedModifiers.overrideUnitPrice}
                        className="w-24 ml-2"
                      />
                    </div>
                  </div>

                  {/* Row 3: Apply Next Pricing Button */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleApplyNextPricingClick}
                      disabled={isApplyNextPricingDisabled}
                      variant="default"
                      className="h-8 px-3 text-sm"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Next Pricing
                    </Button>
                  </div>
                </div>
              </div>

              {/* Check Price Button */}
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleCheckPrice}
                  className="w-1/2 bg-red-900 hover:bg-red-800 text-white font-medium py-2 px-4"
                  disabled={isCheckPriceDisabled}
                >
                  Check Price
                </Button>
              </div>
            </div>

            {/* Results Section */}
            {results && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Unit Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Manufacturing Cost</div>
                    <div className="text-xl font-semibold text-gray-800">{results.manufacturingCost}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Unit Cost</div>
                    <div className="text-xl font-semibold text-gray-800">{results.unitCost}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Unit Price</div>
                    <div className="text-xl font-semibold text-gray-800">{results.unitPrice}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conditions Card */}
        <Card className="bg-white shadow-xl w-full lg:w-72 flex-shrink-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing Conditions</h3>
            {pricingConditions.length > 0 ? (
              <ul className="space-y-2 list-disc pl-5">
                {pricingConditions.map((condition, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {condition}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Select an actor and enter a valid item ID to see pricing conditions.</p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Reset Button at the very bottom */}
      <div className="mt-8 flex justify-center pb-4 w-full">
        <Button
          onClick={handleReset}
          disabled={!results && !itemId.trim() && !selectedActor}
          variant="outline"
          className="w-48"
        >
          Reset All
        </Button>
      </div>
    </div>
  )
}
