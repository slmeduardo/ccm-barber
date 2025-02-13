
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"

const Management = () => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM"
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Schedule Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Select Working Days</h2>
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={setSelectedDates}
            className="rounded-md border"
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Selected Dates</h2>
          <div className="space-y-2">
            {selectedDates.map((date) => (
              <div key={date.toISOString()} className="text-sm text-muted-foreground">
                {date.toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              {weekDays.map((day) => (
                <TableHead key={day}>{day}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((time) => (
              <TableRow key={time}>
                <TableCell className="font-medium">{time}</TableCell>
                {weekDays.map((day) => (
                  <TableCell key={`${day}-${time}`} className="text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Management
