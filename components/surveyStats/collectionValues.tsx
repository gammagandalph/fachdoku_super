import DatePickerComponent from "@/components/utilityComponents/datePickerComponent";
import { TextField } from "@mui/material";
import { DataField } from "@prisma/client";

interface CollectionValuesProps {
  dataField: DataField;
  value: Date | number | string;
  onChange: (values: Date | number | string) => void;
}

export default function CollectionValues({
  dataField,
  value,
  onChange,
}: CollectionValuesProps) {
  switch (dataField.collectionType) {
    case "Text":
      return (
        <TextField value={value} onChange={(e) => onChange(e.target.value)} />
      );
    case "Int":
      return (
        <TextField
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
        />
      );
    case "Num":
      return (
        <TextField
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      );
    case "Date":
      return (
        <DatePickerComponent
          currentAnswer={new Date(value) || undefined}
          onChange={(d) => onChange(d)}
        />
      );
  }
}

