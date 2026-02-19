import type { StrategicIntent } from "@/lib/domain/commitment"
import { Card } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"

interface StrategicIntentSectionProps {
  intent: StrategicIntent
}

export function StrategicIntentSection({ intent }: StrategicIntentSectionProps) {
  return (
    <div>
      <SectionHeader title="Strategic Context" className="mb-3" />
      <Card>
        <p className="text-lg leading-relaxed text-zinc-900 dark:text-zinc-100">
          {intent.text}
        </p>
      </Card>
    </div>
  )
}
