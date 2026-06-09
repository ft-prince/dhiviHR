// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Input, Label } from "@/components/ui/input";
// import { Combobox } from "@/components/ui/combobox";
// import { State, City } from "country-state-city";

// interface CollegeResult {
//   name: string;
//   state: string;
//   district: string;
//   aisheCode: string;
// }

// interface CollegePickerValue {
//   mode: "db" | "custom";
//   collegeName?: string;
//   collegeState?: string;
//   collegeCity?: string;
//   customCollegeName?: string;
//   customState?: string;
//   customCity?: string;
// }

// interface CollegePickerProps {
//   value: CollegePickerValue;
//   onChange: (value: CollegePickerValue) => void;
//   fieldErrors?: Record<string, string>;
// }

// function FieldError({ error }: { error?: string }) {
//   if (!error) return null;
//   return <p className="text-xs text-destructive mt-1">{error}</p>;
// }

// function useDebounce<T>(value: T, delay: number): T {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(t);
//   }, [value, delay]);
//   return debounced;
// }

// export function CollegePicker({ value, onChange, fieldErrors = {} }: CollegePickerProps) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<CollegeResult[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [selectedLabel, setSelectedLabel] = useState("");
//   const debouncedQuery = useDebounce(query, 300);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const states = State.getStatesOfCountry("IN");
//   const allCities = City.getCitiesOfCountry("IN");
//   const [customStateCode, setCustomStateCode] = useState("");
//   const filteredCities = customStateCode
//     ? allCities?.filter((c) => c.stateCode === customStateCode)
//     : allCities;

//   // Fetch from local API route
//   useEffect(() => {
//     if (!debouncedQuery || debouncedQuery.length < 3 || value.mode === "custom") {
//       setResults([]);
//       setOpen(false);
//       return;
//     }
//     let cancelled = false;
//     setLoading(true);
//     fetch(`/api/colleges?search=${encodeURIComponent(debouncedQuery)}`)
//       .then((r) => r.json())
//       .then((data) => {
//         if (!cancelled) {
//           setResults(data.colleges ?? []);
//           setOpen((data.colleges ?? []).length > 0);
//         }
//       })
//       .catch(() => {
//         if (!cancelled) setResults([]);
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });
//     return () => {
//       cancelled = true;
//     };
//   }, [debouncedQuery, value.mode]);

//   // Close dropdown on outside click
//   useEffect(() => {
//     function handleClick(e: MouseEvent) {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target as Node) &&
//         inputRef.current !== e.target
//       ) {
//         setOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClick);
//     return () => document.removeEventListener("mousedown", handleClick);
//   }, []);

//   function handleSelectCollege(college: CollegeResult) {
//     setSelectedLabel(college.name);
//     setQuery(college.name);
//     setOpen(false);
//     onChange({
//       mode: "db",
//       collegeName: college.name,
//       collegeState: college.state,
//       collegeCity: college.district,
//     });
//   }

//   function handleClear() {
//     setQuery("");
//     setSelectedLabel("");
//     setResults([]);
//     onChange({ mode: "db" });
//     inputRef.current?.focus();
//   }

//   function switchToCustom() {
//     setQuery("");
//     setSelectedLabel("");
//     setResults([]);
//     setCustomStateCode("");
//     onChange({ mode: "custom" });
//   }

//   function switchToSearch() {
//     setCustomStateCode("");
//     onChange({ mode: "db" });
//   }

//   function handleCustomStateSelect(isoCode: string) {
//     const found = states.find((s) => s.isoCode === isoCode);
//     setCustomStateCode(isoCode);
//     onChange({
//       ...value,
//       mode: "custom",
//       customState: found?.name || "",
//       customCity: "",
//     });
//   }

//   function handleCustomCitySelect(val: string) {
//     const dashIndex = val.indexOf("-");
//     const cityName = val.substring(dashIndex + 1);
//     const stateCode = val.substring(0, dashIndex);
//     const found = states.find((s) => s.isoCode === stateCode);
//     setCustomStateCode(stateCode);
//     onChange({
//       ...value,
//       mode: "custom",
//       customState: found?.name || "",
//       customCity: cityName,
//     });
//   }

//   if (value.mode === "custom") {
//     return (
//       <div className="space-y-3">
//         <div className="flex items-center justify-between">
//           <Label>College Details</Label>
//           <button
//             type="button"
//             onClick={switchToSearch}
//             className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
//           >
//             ← Search college database instead
//           </button>
//         </div>

//         <div>
//           <Label htmlFor="customCollegeName">College Name</Label>
//           <Input
//             id="customCollegeName"
//             name="customCollegeName"
//             required
//             placeholder="Enter your college name"
//             value={value.customCollegeName ?? ""}
//             onChange={(e) =>
//               onChange({ ...value, mode: "custom", customCollegeName: e.target.value })
//             }
//           />
//           <FieldError error={fieldErrors.customCollegeName} />
//         </div>

//         <div>
//           <Label>Location</Label>
//           <div className="flex flex-row gap-2 mt-1">
//             <div className="flex flex-col flex-1">
//               <Combobox
//                 options={states.map((s) => ({ value: s.isoCode, label: s.name }))}
//                 placeholder="Select state..."
//                 value={value.customState ?? ""}
//                 onSelect={handleCustomStateSelect}
//                 onClear={() => {
//                   setCustomStateCode("");
//                   onChange({ ...value, mode: "custom", customState: "", customCity: "" });
//                 }}
//               />
//               <FieldError error={fieldErrors.customState} />
//             </div>
//             <div className="flex flex-col flex-1">
//               <Combobox
//                 options={
//                   filteredCities?.map((c) => ({
//                     value: `${c.stateCode}-${c.name}`,
//                     label: c.name,
//                   })) || []
//                 }
//                 placeholder="Select city..."
//                 value={value.customCity ?? ""}
//                 onSelect={handleCustomCitySelect}
//                 onClear={() => onChange({ ...value, mode: "custom", customCity: "" })}
//               />
//               <FieldError error={fieldErrors.customCity} />
//             </div>
//           </div>
//         </div>

//         <input type="hidden" name="collegeInputMode" value="custom" />
//         <input type="hidden" name="customCollegeName" value={value.customCollegeName ?? ""} />
//         <input type="hidden" name="customState" value={value.customState ?? ""} />
//         <input type="hidden" name="customCity" value={value.customCity ?? ""} />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-2">
//       <Label htmlFor="collegeSearch">College</Label>
//       <div className="relative">
//         <div className="relative">
//           <Input
//             ref={inputRef}
//             id="collegeSearch"
//             autoComplete="off"
//             placeholder="Search for your college..."
//             value={query}
//             onChange={(e) => {
//               setQuery(e.target.value);
//               if (selectedLabel && e.target.value !== selectedLabel) {
//                 setSelectedLabel("");
//                 onChange({ mode: "db" });
//               }
//             }}
//             onFocus={() => results.length > 0 && setOpen(true)}
//             className={selectedLabel ? "pr-8" : ""}
//           />
//           {loading && (
//             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
//               Searching…
//             </span>
//           )}
//           {selectedLabel && !loading && (
//             <button
//               type="button"
//               onClick={handleClear}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm leading-none"
//               aria-label="Clear selection"
//             >
//               ✕
//             </button>
//           )}
//         </div>

//         {open && results.length > 0 && (
//           <div
//             ref={dropdownRef}
//             className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-64 overflow-y-auto"
//           >
//             {results.map((college, i) => (
//               <button
//                 key={i}
//                 type="button"
//                 className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex flex-col gap-0.5"
//                 onMouseDown={(e) => {
//                   e.preventDefault();
//                   handleSelectCollege(college);
//                 }}
//               >
//                 <span className="font-medium leading-tight">{college.name}</span>
//                 <span className="text-xs text-muted-foreground">
//                   {college.district}, {college.state}
//                 </span>
//               </button>
//             ))}
//           </div>
//         )}

//         {open && results.length === 0 && !loading && debouncedQuery.length >= 3 && (
//           <div
//             ref={dropdownRef}
//             className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md px-3 py-3 text-sm text-muted-foreground"
//           >
//             No colleges found for &ldquo;{debouncedQuery}&rdquo;
//           </div>
//         )}
//       </div>

//       <FieldError error={fieldErrors.collegeName} />

//       {selectedLabel && (
//         <>
//           <input type="hidden" name="collegeInputMode" value="db" />
//           <input type="hidden" name="dbCollegeName" value={value.collegeName ?? ""} />
//           <input type="hidden" name="dbCollegeState" value={value.collegeState ?? ""} />
//           <input type="hidden" name="dbCollegeCity" value={value.collegeCity ?? ""} />
//         </>
//       )}

//       <p className="text-xs text-muted-foreground">
//         Can&apos;t find your college?{" "}
//         <button
//           type="button"
//           onClick={switchToCustom}
//           className="underline underline-offset-2 hover:text-foreground transition-colors"
//         >
//           Add it manually
//         </button>
//       </p>
//     </div>
//   );
// }