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
    let currentUnitCost = initialBaseUnitCost

    // 1. Apply 'Apply next pricing'
    // This affects manufacturingCost and unitCost, but NOT unitPrice directly.
    if (modifiers.applyNextPricing) {
      currentManufacturingCost += 3.0 // Apply to manufacturing cost
      currentUnitCost += 8.0 // Apply to unit cost
    }

    // 2. Apply 'Apply standard trim discount'
    // This applies to unitCost and unitPrice, ONLY if not overridden.
    // Note: The discount is applied to the *calculated* unit cost before any override.
    if (modifiers.applyStandardTrimDiscount) {
      // Apply discount to unitCost if it's not being overridden
      if (!modifiers.overrideUnitCost) {
        // Check if override is NOT active for unit cost
        currentUnitCost *= 0.85 // 15% discount
      }
      // Unit price discount will be handled after finalUnitCost is determined
    }

    // 3. Determine finalUnitCost, prioritizing override if active
    const finalUnitCost =
      modifiers.overrideUnitCost && overrideValues.unitCost
        ? Number.parseFloat(overrideValues.unitCost)
        : currentUnitCost

    let finalUnitPrice

    // 4. Logic for finalUnitPrice based on "Add account with markup" and "Override unit price"
    if (modifiers.addAccountWithMarkup) {
      // If markup is ON
      if (modifiers.overrideUnitPrice && overrideValues.unitPrice) {
        // If unit price is overridden, use the overridden value
        finalUnitPrice = Number.parseFloat(overrideValues.unitPrice)
      } else {
        // Otherwise, apply 20% markup to the finalUnitCost
        finalUnitPrice = finalUnitCost * 1.2
      }
    } else {
      // If markup is OFF, unit price always matches unit cost
      finalUnitPrice = finalUnitCost
    }

    setResults({
      manufacturingCost: `$${currentManufacturingCost.toFixed(2)}`, // Manufacturing cost is not overridden by unit cost override
      unitCost: `$${finalUnitCost.toFixed(2)}`,
      unitPrice: `$${finalUnitPrice.toFixed(2)}`,
    })
  }

  // Determine disabled states for UI elements
  const isOverrideUnitPriceDisabled = !results || !modifiers.addAccountWithMarkup
  const isOverrideUnitCostDisabled = !results

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-950 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-4xl md:text-5xl font-bold">Pricing rules validator</h1>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto">
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
                <div className={`space-y-3 ${!results ? "opacity-50" : ""}`}>
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
                      Add account with markup (15%)
                    </Label>
                  </div>
                  {/* Apply Next Pricing as a Button */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleApplyNextPricingClick}
                      disabled={!results}
                      variant="default" // No conditional variant for "on/off" visual
                      className="h-8 px-3 text-sm"
                    >
                      Apply next pricing
                    </Button>
                    {/* No label needed here as the button itself is the action */}
                  </div>
                  {/* Reordered Checkboxes */}
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
                {/* Reset Button */}
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleReset}
                    disabled={!results && !itemId.trim()} // Disable if no results and no item ID entered
                    variant="outline"
                    className="w-1/2"
                  >
                    Reset All
                  </Button>
                </div>
              </div>

              {/* Check Price Button */}
              <div className="flex justify-center">
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
    </div>
  )
}
