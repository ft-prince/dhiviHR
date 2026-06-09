"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signupAction, studentSignupAction, getStreamsForAccessCodeAction } from "@/lib/auth/actions";
import { Country, State, City } from "country-state-city";
import { Combobox } from "@/components/ui/combobox";


interface StreamOption {
  id: string;
  name: string;
}

export function SignupForm({ variant = "public", streams: initialStreams = [] }: { variant?: "public" | "student"; streams: StreamOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [streams, setStreams] = useState<StreamOption[]>(initialStreams);
  const [loadingStreams, setLoadingStreams] = useState(false);

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

  async function handleAccessCodeBlur(e: React.FocusEvent<HTMLInputElement>) {
    const code = e.target.value.trim();
    if (!code || code.length < 6) return;
    setLoadingStreams(true);
    try {
      const result = await getStreamsForAccessCodeAction(code);
      setStreams(result);
    } finally {
      setLoadingStreams(false);
    }
  }

  useEffect(() => {
    setStreams(initialStreams);
  }, [initialStreams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("state", selectedStateName);
    fd.set("city", selectedCityName);
    start(async () => {
      const action = variant === "student" ? studentSignupAction : signupAction;
      const res = await action(fd);
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error);
        setFieldErrors(res.fieldErrors || {});
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {variant === "student" && (
        <div>
          <Label htmlFor="accessCode">College Access Code</Label>
          <Input
            id="accessCode"
            name="accessCode"
            required
            placeholder="DH-XXXXXX"
            className="uppercase tracking-widest"
            onBlur={handleAccessCodeBlur}
          />
          {loadingStreams && <p className="text-xs text-ink-muted mt-1">Loading streams...</p>}
        </div>
      )}
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      
        {variant !== "student" &&
        <div>
          <Label htmlFor="collegeName">College Name</Label>
        <Input id="collegeName" name="collegeName" required minLength={2} />
      </div>
      }
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
        <Label htmlFor="stream">Stream</Label>
        <select
          id="stream"
          name="stream"
          required
          defaultValue=""
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {variant === "student" && streams.length === 0 ? "Enter access code first..." : "Select a stream..."}
          </option>
          {streams.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="phone">Whatsapp Number</Label>
        <Input id="phone" name="phone" type="tel" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" required minLength={8} />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : variant === "student" ? "Redeem & Sign Up" : "Create Account"}
      </Button>
    </form>
  );
}
