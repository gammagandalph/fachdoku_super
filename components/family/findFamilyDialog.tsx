import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Prisma } from "@prisma/client";
import { useState, useEffect } from "react";
import { getAge } from "../../utils/utils";
import { RssFeed } from "@mui/icons-material";
import { IFamilies } from "../../pages/api/families";
import useNotification from "../utilityComponents/notificationContext";
import { FullFamily } from "../../types/prismaHelperTypes";

type FindFamilyDialogProps = {
  open: boolean;
  onConfirm: (
    family: Prisma.FamilyGetPayload<{
      include: { caregivers: true; children: true };
    }>
  ) => void;
  onCancel: () => void;
};

export default function FindFamilyDialog({
  open,
  onConfirm,
  onCancel,
}: FindFamilyDialogProps) {
  const [families, setFamilies] = useState<FullFamily[]>([]);
  const [family, setFamily] = useState<FullFamily | undefined>(undefined);
  const [error, setError] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [searchStart, setSearchStart] = useState<string>("");

  const { addAlert } = useNotification();

  function handleConfirm() {
    onConfirm(family);
  }

  useEffect(() => {
    setSearching(true);
    const fetchData = async () => {
      let start = parseInt(searchStart);
      if (!start || isNaN(start)) {
        return;
      }
      const res = await fetch(
        `/api/families?number=${start}&number=${start + 8}`
      );
      if (res.status !== 200) {
        addAlert({
          message: `Fehler beim Abrufen der Familien: Status ${res.status}`,
          severity: "error",
        });
        return;
      }
      const response = (await res.json()) as IFamilies;
      setFamilies(response.families);
    };
    if (searchStart) fetchData();
    setSearching(false);
  }, [searchStart]);

  function getOptionsString(family: FullFamily) {
    return `Familiennummer: ${family.number} (${
      family.caregivers.length
    } Bezugspersonen, Kinder (${family.childrenInHousehold}): ${family.children
      .map((c) => {
        if (!c.dateOfBirth) return "unbekanntes Alter";
        const age = getAge(new Date(c.dateOfBirth));
        return `${age}`;
      })
      .join(", ")})`;
  }

  function handleChange(_: any, value: FullFamily | null) {
    setFamily(value ?? undefined);
  }

  function handleInputChange(_: any, value: string) {
    try {
      parseInt(value);
      setSearchStart(value);
    } catch (e) {
      return;
    }
  }

  return (
    <Dialog maxWidth={"md"} fullWidth open={open}>
      <DialogTitle></DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Autocomplete
          sx={{ mt: ".5rem" }}
          inputValue={searchStart}
          onInputChange={handleInputChange}
          isOptionEqualToValue={(option, value) =>
            option.number === option.number
          }
          getOptionLabel={(family) => getOptionsString(family)}
          value={family ?? null}
          onChange={handleChange}
          renderInput={(params) => (
            <TextField {...params} label="Suche nach Familiennummer" />
          )}
          filterOptions={(options) => options}
          options={families}
        />
        {searching && <CircularProgress />}
        {error && <Alert severity={"error"}>{error}</Alert>}
        {/* {family && <FamilyComponent family={family} />} */}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm}>Bestätigen</Button>
        <Button onClick={onCancel}>Abbrechen</Button>
      </DialogActions>
    </Dialog>
  );
}