"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createRef, useEffect, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

export type ComboboxOptions = {
  value: string,
  label: string
}[];

export interface ComboboxProps {
  options: ComboboxOptions,
  hintText: string
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function Combobox(props: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const commandGroup = createRef<HTMLDivElement>();

  // Search only works on values, so need to use label as value
  const [labelToValue, setLabelToValue] = useState<Record<string, string>>({});
  const [valueToLabel, setValueToLabel] = useState<Record<string, string>>({});
  useEffect(() => {
    const newRecord1 = {} as Record<string, string>;
    const newRecord2 = {} as Record<string, string>;
    for (const option of props.options) {
      newRecord1[option.label] = option.value;
      newRecord2[option.value] = option.label;
    }

    setLabelToValue(newRecord1);
    setValueToLabel(newRecord2);
  }, [props.options]);
 
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {props.value
            ? props.options.find((option) => option.value === props.value)?.label
            : props.hintText}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder={props.hintText}
            onValueChange={() => {
              if (commandGroup.current) {
                commandGroup.current.scrollIntoView();
                setTimeout(() => {
                  commandGroup.current!.scrollIntoView();
                }, 1);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>Loading</CommandEmpty>
            <CommandGroup ref={commandGroup} >
              {props.options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentLabel) => {
                    const propsLabel = props.value ? valueToLabel[props.value!] : props.value
                    props.onChange(currentLabel === propsLabel ? "" : labelToValue[currentLabel])
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      props.value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}