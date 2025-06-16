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
    applyNextPricing: false,
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
    if (results) {
      handleCheckPrice()
    }
  }, [overrideValues, modifiers])

  const handleModifierChange = (modifier: keyof typeof modifiers) => {
    setModifiers((prev) => ({
      ...prev,
      [modifier]: !prev[modifier],
    }))
  }

  const handleCheckPrice = () => {
    // Mock calculation - replace with actual logic later
    let basePrice = 25.0
    let manufacturingCost = 15.0

    // Apply modifiers (mock logic)
    if (modifiers.applyStandardTrimDiscount) {
      basePrice *= 0.9 // 10% discount
    }
    if (modifiers.addAccountWithMarkup) {
      basePrice *= 1.15 // 15% markup
    }
    if (modifiers.applyNextPricing) {
      basePrice += 8.0 // $8 next pricing fee
      manufacturingCost += 3.0
    }

    // Use override values if checkboxes are checked and values are provided
    const finalUnitCost =
      modifiers.overrideUnitCost && overrideValues.unitCost ? Number.parseFloat(overrideValues.unitCost) : basePrice

    const finalUnitPrice =
      modifiers.overrideUnitPrice && overrideValues.unitPrice
        ? Number.parseFloat(overrideValues.unitPrice)
        : finalUnitCost * 1.2 // 20% markup

    setResults({
      manufacturingCost: `$${manufacturingCost.toFixed(2)}`,
      unitCost: `$${finalUnitCost.toFixed(2)}`,
      unitPrice: `$${finalUnitPrice.toFixed(2)}`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-950 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-4xl md:text-5xl font-bold">Price Check</h1>
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
                  className="w-full"
                />
              </div>

              {/* Modifiers Section */}
              <div>
                <Label className="text-base font-medium text-gray-700 mb-3 block">Modifiers</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="applyStandardTrimDiscount"
                      checked={modifiers.applyStandardTrimDiscount}
                      onCheckedChange={() => handleModifierChange("applyStandardTrimDiscount")}
                    />
                    <Label htmlFor="applyStandardTrimDiscount" className="text-sm font-normal">
                      Apply standard trim discount
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="addAccountWithMarkup"
                      checked={modifiers.addAccountWithMarkup}
                      onCheckedChange={() => handleModifierChange("addAccountWithMarkup")}
                    />
                    <Label htmlFor="addAccountWithMarkup" className="text-sm font-normal">
                      Add account with markup
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="applyNextPricing"
                      checked={modifiers.applyNextPricing}
                      onCheckedChange={() => handleModifierChange("applyNextPricing")}
                    />
                    <Label htmlFor="applyNextPricing" className="text-sm font-normal">
                      Apply next pricing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overrideUnitPrice"
                      checked={modifiers.overrideUnitPrice}
                      onCheckedChange={() => handleModifierChange("overrideUnitPrice")}
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
                      disabled={!modifiers.overrideUnitPrice}
                      className="w-24 ml-2"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overrideUnitCost"
                      checked={modifiers.overrideUnitCost}
                      onCheckedChange={() => handleModifierChange("overrideUnitCost")}
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
                      disabled={!modifiers.overrideUnitCost}
                      className="w-24 ml-2"
                    />
                  </div>
                </div>
              </div>

              {/* Check Price Button */}
              <Button
                onClick={handleCheckPrice}
                className="w-full bg-red-900 hover:bg-red-800 text-white font-medium py-2 px-4"
                disabled={!itemId.trim()}
              >
                Check Price
              </Button>
            </div>

            {/* Results Section */}
            {results && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Unit Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
