"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  getSpecificationTemplate,
  type SpecificationField,
  type ListingCategory,
} from "@humanlayer/shared";

interface SpecificationFormProps {
  category: ListingCategory;
  value: Record<string, any>;
  onChange: (specifications: Record<string, any>) => void;
}

export function SpecificationForm({ category, value, onChange }: SpecificationFormProps) {
  const [specifications, setSpecifications] = useState<Record<string, any>>(value || {});
  const [template, setTemplate] = useState<SpecificationField[]>([]);

  useEffect(() => {
    const newTemplate = getSpecificationTemplate(category);
    setTemplate(newTemplate);

    // Reset specifications when category changes
    const newSpecs: Record<string, any> = {};
    newTemplate.forEach(field => {
      if (value && value[field.key] !== undefined) {
        newSpecs[field.key] = value[field.key];
      } else if (field.type === "boolean") {
        newSpecs[field.key] = false;
      } else if (field.type === "multiselect") {
        newSpecs[field.key] = [];
      }
    });
    setSpecifications(newSpecs);
    onChange(newSpecs);
  }, [category]);

  const handleFieldChange = (key: string, fieldValue: any) => {
    const updated = { ...specifications, [key]: fieldValue };
    setSpecifications(updated);
    onChange(updated);
  };

  const renderField = (field: SpecificationField) => {
    const fieldValue = specifications[field.key];

    switch (field.type) {
      case "text":
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              value={fieldValue || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.unit && <span className="text-gray-500 text-xs ml-2">({field.unit})</span>}
            </label>
            <Input
              type="number"
              value={fieldValue || ""}
              onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value) || 0)}
              placeholder={field.placeholder}
            />
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={fieldValue || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">-- Select {field.label} --</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "multiselect":
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-1">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(fieldValue || []).includes(option)}
                    onChange={(e) => {
                      const current = fieldValue || [];
                      const updated = e.target.checked
                        ? [...current, option]
                        : current.filter((v: string) => v !== option);
                      handleFieldChange(field.key, updated);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      case "boolean":
        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={fieldValue || false}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 ml-6">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>📋 Specification Guide:</strong> Fill out these fields to help AI agents and buyers
          understand exactly what you're offering. The more detail you provide, the better matches you'll get.
        </p>
      </div>

      {template.map((field) => renderField(field))}

      {template.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Select a category to see guided specification fields
        </p>
      )}
    </div>
  );
}
