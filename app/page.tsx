"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function PriceCheckApp() {
  const [itemId, setItemId] = useState("")
  const [modifiers, setModifiers] = useState({
    applyStandardTrimDiscount: false,
    addAccountWithMarkup: false,
    applyNextPricing: false, // This will be set to true by the button click
    overrideUnitPrice: false,
    overrideUnitCost: false,
  })
  const [overrideValues, setOverrideValues] = useState({
    unitPrice: "",
    unitCost: "",
  })
  const [results, setResults] = useState<{
    manufacturingCost: string
    unitCost: string
    unitPrice: string
  } | null>(null)

  useEffect(() => {
    // Recalculate prices if modifiers or override values change, but only if results are already displayed
    if (results) {
      handleCheckPrice()
    }
  }, [overrideValues, modifiers])

  const handleModifierChange = (modifier: keyof typeof modifiers) => {
    setModifiers((prev) => {
      const newModifiers = {
        ...prev,
        [modifier]: !prev[modifier],
      }

      // If "Add account with markup" is turned off, disable and uncheck "Override unit price"
      if (modifier === "addAccountWithMarkup" && !newModifiers.addAccountWithMarkup) {
        newModifiers.overrideUnitPrice = false
        setOverrideValues((prev) => ({ ...prev, unitPrice: "" })) // Clear override value
      }
      return newModifiers
    })
  }

  const handleApplyNextPricingClick = () => {
    setModifiers((prev) => ({
      ...prev,
      applyNextPricing: true, // Always set to true when button is clicked
      overrideUnitCost: false, // Uncheck override unit cost
    }))
    setOverrideValues((prev) => ({ ...prev, unitCost: "" })) // Clear override unit cost value
    // handleCheckPrice will be called by the useEffect due to modifiers/overrideValues change
  }

  const handleReset = () => {
    setModifiers({
      applyStandardTrimDiscount: false,
      addAccountWithMarkup: false,
      applyNextPricing: false,
      overrideUnitPrice: false,
      overrideUnitCost: false,
    })
    setOverrideValues({
      unitPrice: "",
      unitCost: "",
    })
    setResults(null) // Clear results
    setItemId("") // Clear item ID
  }

  const handleCheckPrice = () => {
    const initialBaseUnitCost = 25.0 // Base for unit cost calculation
    const initialManufacturingCost = 15.0 // Base for manufacturing cost

    let currentManufacturingCost = initialManufacturingCost
    let calculatedUnitCost = initialBaseUnitCost // This will be the base for unit cost and unit price calculations

    // 1. Apply 'Apply next pricing'
    if (modifiers.applyNextPricing) {
      currentManufacturingCost += 3.0 // Apply to manufacturing cost
      calculatedUnitCost += 8.0 // Apply to calculated unit cost
    }

    // 2. Apply 'Apply standard trim discount' to calculatedUnitCost
    // This applies to calculatedUnitCost, which is the base for the markup calculation.
    if (modifiers.applyStandardTrimDiscount) {
      calculatedUnitCost *= 0.85 // Apply 15% discount
    }

    // 3. Determine finalUnitCost, prioritizing override if active
    const finalUnitCost =
      modifiers.overrideUnitCost && overrideValues.unitCost
        ? Number.parseFloat(overrideValues.unitCost)
        : calculatedUnitCost // If overrideUnitCost is off, finalUnitCost is the discounted calculatedUnitCost

    let finalUnitPrice

    // 4. Logic for finalUnitPrice based on "Add account with markup" and "Override unit price"
    if (modifiers.addAccountWithMarkup) {
      // If markup is ON
      if (modifiers.overrideUnitPrice && overrideValues.unitPrice) {
        // If unit price is overridden, use the overridden value
        finalUnitPrice = Number.parseFloat(overrideValues.unitPrice)
      } else {
        // If unit price is NOT overridden, apply 50% markup to the *calculatedUnitCost*
        // (which already has the standard trim discount applied if applicable)
        finalUnitPrice = calculatedUnitCost * 1.5 // Apply 50% markup
      }
    } else {
      // If markup is OFF, unit price always matches finalUnitCost
      finalUnitPrice = finalUnitCost
    }

    setResults({
      manufacturingCost: `$${currentManufacturingCost.toFixed(2)}`,
      unitCost: `$${finalUnitCost.toFixed(2)}`,
      unitPrice: `$${finalUnitPrice.toFixed(2)}`,
    })
  }

  // Determine disabled states for UI elements
  const isOverrideUnitPriceDisabled = !results || !modifiers.addAccountWithMarkup
  const isOverrideUnitCostDisabled = !results

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-950 p-4 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-4xl md:text-5xl font-bold">Pricing rules validator</h1>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto w-full flex-grow">
        <Card className="bg-white shadow-xl">
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
                  onChange={(e) => setItemId(e.target.value)}
                  placeholder="Enter item identifier"
                  className="w-64"
                />
              </div>

              {/* Modifiers Section */}
              <div>
                <Label className="text-base font-medium text-gray-700 mb-3 block">Modifiers</Label>
                <div className={`space-y-4 ${!results ? "opacity-50" : ""}`}>
                  {/* Row 1: Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="applyStandardTrimDiscount"
                        checked={modifiers.applyStandardTrimDiscount}
                        onCheckedChange={() => handleModifierChange("applyStandardTrimDiscount")}
                        disabled={!results}
                      />
                      <Label htmlFor="applyStandardTrimDiscount" className="text-sm font-normal">
                        Apply standard trim discount (15%)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="addAccountWithMarkup"
                        checked={modifiers.addAccountWithMarkup}
                        onCheckedChange={() => handleModifierChange("addAccountWithMarkup")}
                        disabled={!results}
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
                        checked={modifiers.overrideUnitCost}
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
                        value={overrideValues.unitCost}
                        onChange={(e) => setOverrideValues((prev) => ({ ...prev, unitCost: e.target.value }))}
                        disabled={isOverrideUnitCostDisabled || !modifiers.overrideUnitCost}
                        className="w-24 ml-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overrideUnitPrice"
                        checked={modifiers.overrideUnitPrice}
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
                        value={overrideValues.unitPrice}
                        onChange={(e) => setOverrideValues((prev) => ({ ...prev, unitPrice: e.target.value }))}
                        disabled={isOverrideUnitPriceDisabled || !modifiers.overrideUnitPrice}
                        className="w-24 ml-2"
                      />
                    </div>
                  </div>

                  {/* Row 3: Apply Next Pricing Button */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleApplyNextPricingClick}
                      disabled={!results}
                      variant="default"
                      className="h-8 px-3 text-sm"
                    >
                      Apply next pricing
                    </Button>
                  </div>
                </div>
              </div>

              {/* Check Price Button */}
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleCheckPrice}
                  className="w-1/2 bg-red-900 hover:bg-red-800 text-white font-medium py-2 px-4"
                  disabled={!itemId.trim()}
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
      </div>
      {/* Reset Button at the very bottom */}
      <div className="mt-8 flex justify-center pb-4">
        <Button onClick={handleReset} disabled={!results && !itemId.trim()} variant="outline" className="w-48">
          Reset All
        </Button>
      </div>
    </div>
  )
}
