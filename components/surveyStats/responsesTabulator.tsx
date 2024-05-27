import { FullSurvey } from "@/types/prismaHelperTypes"
import { useResponses } from "@/utils/apiHooks"
import { allAnswersColumnDefinition, responsesToAllAnswersTable } from "@/utils/tableUtils";
import { Box } from "@mui/system";
import { format } from "date-fns";
import { useMemo, useRef } from "react";
import { ReactTabulator, } from "react-tabulator"

export default function ResponsesTabulator({ survey }: { survey: FullSurvey }) {
  const { responses } = useResponses(survey.id)

  const tableRef = useRef(null);

  const columns = useMemo(() => allAnswersColumnDefinition(survey), [survey]);
  const data = useMemo(() => responsesToAllAnswersTable(responses), [responses, survey]);

  function downlaodCSV() {
    tableRef.current.download("csv", `${survey.name}-${format(new Date(), "yyyy-MM-dd_hh-mm")}.csv`)
  }

  return <Box>
    <ReactTabulator onRef={ref => tableRef.current = ref.current} columns={columns} data={data} style={{ height: "105%" }} />
  </Box>
}