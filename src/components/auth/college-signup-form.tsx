"use client";


import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Country, State, City } from "country-state-city";
import { Combobox } from "@/components/ui/combobox";
import { collegeAdminSignupAction } from "@/lib/auth/actions";

export function CollegeSignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const country = Country.getCountryByCode("IN");
  const states = State.getStatesOfCountry("IN");
  const allCities = City.getCitiesOfCountry("IN");
  
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedCityCode, setSelectedCityCode] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  
  const filteredCities = selectedStateCode ? allCities?.filter(c => c.stateCode === selectedStateCode) : allCities;

  function handleStateSelect(isoCode: string){
    const found = states.find(s => s.isoCode === isoCode);
    setSelectedStateCode(isoCode);
    setSelectedStateName(found?.name || "");
    setSelectedCityCode("");
    setSelectedCityName("");
  }

  function handleCitySelect(value: string){
    const dashIndex = value.indexOf("-");
    const stateCode = value.substring(0, dashIndex);
    const cityName = value.substring(dashIndex + 1);
    setSelectedCityCode(value);
    setSelectedCityName(cityName);
    const found = states.find(s => s.isoCode === stateCode);
    setSelectedStateCode(stateCode);
    setSelectedStateName(found?.name || "");
  }

  function FieldError({error}: {error?: string}) {
    if (!error) return null;
    return <p className="text-xs text-destructive mt-1">{error}</p>
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("state", selectedStateName);
    fd.set("city", selectedCityName);
    start(async () => {
      const res = await collegeAdminSignupAction(fd);
      if (res.ok && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else if (!res.ok) {
        setFieldErrors(res.fieldErrors || {});
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="collegeName">College Name</Label>
        <Input id="collegeName" name="collegeName" required minLength={2} />
        <FieldError error={fieldErrors.collegeName} />
      </div>
      <div>
        <Label htmlFor="email">College Email</Label>
        <Input id="email" name="email" type="email" required />
        <FieldError error={fieldErrors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Location</Label>
        <div className="flex flex-row gap-2">
        <div className="flex flex-col">
        <Combobox
        options={states.map(s => ({ value: s.isoCode, label: s.name }))}
        placeholder="Select state..."
        value={selectedStateName}
        onSelect={handleStateSelect}
        onClear={() => {setSelectedStateCode(""); setSelectedStateName("");}}
        />
        <FieldError error={fieldErrors.state} />
        </div>

        <div className="flex flex-col">
        <Combobox
        options={filteredCities?.map(c => ({ value: `${c.stateCode}-${c.name}`, label: c.name })) || []}
        placeholder="Select city..."
        value={selectedCityName}
        onSelect={handleCitySelect}
        onClear={() => {setSelectedCityCode(""); setSelectedCityName("");}}
        />
        <FieldError error={fieldErrors.city} />
        </div>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Your Full Name</Label>
        <Input id="name" name="name" required minLength={2} />
        <FieldError error={fieldErrors.name} />
      </div>
      <div>
        <Label htmlFor="pocDesignation">Designation</Label>
        <Input id="pocDesignation" name="pocDesignation" required minLength={2} />
        <FieldError error={fieldErrors.pocDesignation} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" 
        inputMode="numeric" maxLength={10} pattern="[0-9]{10}"
        onKeyDown={(e) => {
          if (!/[0-9]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) {
            e.preventDefault();
          }
        }}
        onInput = {(e) => {
          const t = e.currentTarget;
          t.value = t.value.replace(/\D/g,"").slice(0,10);
        }}
        required />
        <FieldError error={fieldErrors.phone} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" required minLength={8} />
        <FieldError error={fieldErrors.password} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={8} />
        <FieldError error={fieldErrors.confirmPassword} />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create Account"}
      </Button>
    </form>
  );
}
