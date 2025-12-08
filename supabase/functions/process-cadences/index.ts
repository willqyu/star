import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

interface Cadence {
  id: string
  user_id: string
  contact_id: string
  frequency_days: number
  next_run_at: string
  last_generated_at: string | null
  active: boolean
}

async function processCadence(cadence: Cadence) {
  try {
    const now = new Date()
    const nextRun = new Date()
    nextRun.setDate(nextRun.getDate() + cadence.frequency_days)

    // Create a task for this cadence
    const { error: taskError } = await supabase
      .from("tasks")
      .insert({
        user_id: cadence.user_id,
        contact_id: cadence.contact_id,
        title: `Follow up with contact`,
        description: `Automated follow-up from cadence`,
        status: "open",
        priority: 1,
        auto_generated: true,
        due_at: nextRun.toISOString(),
      })

    if (taskError) {
      console.error(`Failed to create task for cadence ${cadence.id}:`, taskError)
      return
    }

    // Update cadence next_run_at
    const { error: updateError } = await supabase
      .from("cadences")
      .update({
        next_run_at: nextRun.toISOString(),
        last_generated_at: now.toISOString(),
      })
      .eq("id", cadence.id)

    if (updateError) {
      console.error(`Failed to update cadence ${cadence.id}:`, updateError)
    }
  } catch (error) {
    console.error(`Error processing cadence ${cadence.id}:`, error)
  }
}

serve(async (req) => {
  try {
    // This function is called by Supabase scheduled functions
    // Every hour, process cadences that are due

    const now = new Date().toISOString()

    // Get all cadences that are due
    const { data: cadences, error } = await supabase
      .from("cadences")
      .select("*")
      .eq("active", true)
      .lte("next_run_at", now)

    if (error) {
      console.error("Failed to fetch cadences:", error)
      return new Response(
        JSON.stringify({ error: "Failed to fetch cadences" }),
        { status: 500 }
      )
    }

    // Process each cadence
    const promises = (cadences as Cadence[]).map((cadence) =>
      processCadence(cadence)
    )

    await Promise.all(promises)

    return new Response(
      JSON.stringify({
        success: true,
        processed: (cadences as Cadence[]).length,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in cron function:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    )
  }
})
