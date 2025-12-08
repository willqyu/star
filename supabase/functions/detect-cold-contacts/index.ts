import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

interface Contact {
  id: string
  user_id: string
  first_name: string
  last_name: string
  last_interaction_at: string | null
}

interface UserSettings {
  cold_contact_threshold_days: number
}

async function detectColdContacts() {
  try {
    // Get all users and their settings
    const { data: users, error: usersError } = await supabase
      .from("auth.users")
      .select("id")

    if (usersError) {
      console.error("Failed to fetch users:", usersError)
      return 0
    }

    let totalColdDetected = 0

    for (const user of users || []) {
      try {
        // Get user settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_settings")
          .select("cold_contact_threshold_days")
          .eq("user_id", user.id)
          .single()

        if (settingsError) {
          console.warn(`No settings for user ${user.id}`)
          continue
        }

        const threshold = (settings as UserSettings).cold_contact_threshold_days || 90
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - threshold)

        // Get contacts that haven't been interacted with
        const { data: coldContacts, error: contactsError } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, last_interaction_at")
          .eq("user_id", user.id)
          .or(`last_interaction_at.is.null,last_interaction_at.lt.${thresholdDate.toISOString()}`)

        if (contactsError) {
          console.error(`Failed to fetch contacts for user ${user.id}:`, contactsError)
          continue
        }

        // Create tasks for cold contacts
        for (const contact of coldContacts || []) {
          const taskTitle = `Follow up with ${(contact as Contact).first_name} ${(contact as Contact).last_name} - Cold contact`

          // Check if we already have a task for this contact from auto-generation
          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("contact_id", (contact as Contact).id)
            .eq("auto_generated", true)
            .eq("status", "open")
            .ilike("title", "%Follow up%")
            .single()

          if (!existingTask) {
            const { error: taskError } = await supabase
              .from("tasks")
              .insert({
                user_id: user.id,
                contact_id: (contact as Contact).id,
                title: taskTitle,
                description: `This contact hasn't been contacted in ${threshold} days`,
                status: "open",
                priority: 1,
                auto_generated: true,
              })

            if (!taskError) {
              totalColdDetected++
            } else {
              console.error(`Failed to create task for contact ${(contact as Contact).id}:`, taskError)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
      }
    }

    return totalColdDetected
  } catch (error) {
    console.error("Error in cold contact detection:", error)
    return 0
  }
}

serve(async (req) => {
  try {
    const detectedCount = await detectColdContacts()

    return new Response(
      JSON.stringify({
        success: true,
        coldContactsDetected: detectedCount,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in scheduled function:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    )
  }
})
