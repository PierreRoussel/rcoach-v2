import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'

import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { BadgeUnlockOverlay } from '@/components/gamification/BadgeUnlockOverlay'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Pill } from '@/design-system'
import {
  useAdminBadgeDefinitions,
  useCreateBadgeDefinition,
  useDeleteBadgeDefinition,
  useUpdateBadgeDefinition,
  type BadgeDefinitionInput,
} from '@/hooks/useAdminBadgeDefinitions'
import {
  BADGE_CATEGORY_OPTIONS,
  BADGE_ICON_OPTIONS,
  BADGE_RULE_OPTIONS,
  BADGE_TIER_OPTIONS,
  formatBadgeRule,
  mapBadgeRecordToDefinition,
  normalizeBadgeKey,
  resolveBadgeIcon,
  type BadgeDefinitionRecord,
  type BadgeDefinition,
} from '@/lib/gamification/badges'

const EMPTY_FORM: BadgeDefinitionInput = {
  key: '',
  label: '',
  description: '',
  category: 'discipline',
  tier: 'bronze',
  icon_name: 'medal',
  rule_type: 'sessions',
  rule_threshold: 10,
  is_active: true,
  sort_order: 200,
}

type BadgeFormState = BadgeDefinitionInput & { isNew: boolean }

export function AdminBadgesTab() {
  const { data: badges = [], isLoading, error } = useAdminBadgeDefinitions()
  const createBadge = useCreateBadgeDefinition()
  const updateBadge = useUpdateBadgeDefinition()
  const deleteBadge = useDeleteBadgeDefinition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<BadgeFormState>({ ...EMPTY_FORM, isNew: true })
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewBadges, setPreviewBadges] = useState<BadgeDefinition[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const selectedRule = BADGE_RULE_OPTIONS.find((option) => option.value === form.rule_type)

  function openPreview(definition: BadgeDefinition) {
    setPreviewBadges([definition])
    setPreviewOpen(true)
  }

  function previewFromRecord(record: BadgeDefinitionRecord) {
    openPreview(mapBadgeRecordToDefinition(record))
  }

  function previewFromForm() {
    const key = normalizeBadgeKey(form.key) || 'preview_badge'
    if (!form.label.trim() || !form.description.trim()) {
      setActionError('Renseignez au minimum le titre et la description pour l’aperçu.')
      return
    }

    setActionError(null)
    openPreview(
      mapBadgeRecordToDefinition({
        key,
        label: form.label.trim(),
        description: form.description.trim(),
        category: form.category,
        tier: form.tier,
        icon_name: form.icon_name,
        rule_type: form.rule_type,
        rule_threshold: form.rule_threshold,
        is_active: form.is_active,
        sort_order: form.sort_order,
      }),
    )
  }

  function openCreateDialog() {
    setForm({ ...EMPTY_FORM, isNew: true })
    setActionError(null)
    setDialogOpen(true)
  }

  function openEditDialog(badge: BadgeDefinitionRecord) {
    setForm({
      key: badge.key,
      label: badge.label,
      description: badge.description,
      category: badge.category,
      tier: badge.tier,
      icon_name: badge.icon_name,
      rule_type: badge.rule_type,
      rule_threshold: badge.rule_threshold,
      is_active: badge.is_active,
      sort_order: badge.sort_order,
      isNew: false,
    })
    setActionError(null)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    setMessage(null)
    setActionError(null)

    const key = normalizeBadgeKey(form.key)
    if (!key) {
      setActionError('La clé du badge est obligatoire (ex. challenge_mars).')
      return
    }

    if (!form.label.trim() || !form.description.trim()) {
      setActionError('Le titre et la description sont obligatoires.')
      return
    }

    if (selectedRule?.needsThreshold && (form.rule_threshold == null || form.rule_threshold <= 0)) {
      setActionError('Indiquez un seuil numérique pour cette règle.')
      return
    }

    const payload: BadgeDefinitionInput = {
      key,
      label: form.label.trim(),
      description: form.description.trim(),
      category: form.category,
      tier: form.tier,
      icon_name: form.icon_name,
      rule_type: form.rule_type,
      rule_threshold: selectedRule?.needsThreshold ? Number(form.rule_threshold) : null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (form.isNew) {
        await createBadge.mutateAsync(payload)
        setMessage(`Badge « ${payload.label} » créé.`)
      } else {
        const { key: _key, ...changes } = payload
        await updateBadge.mutateAsync({ key, changes })
        setMessage(`Badge « ${payload.label} » mis à jour.`)
      }

      setDialogOpen(false)
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : 'Impossible d’enregistrer le badge.',
      )
    }
  }

  async function handleDelete(key: string, label: string) {
    if (!window.confirm(`Supprimer le badge « ${label} » ?`)) {
      return
    }

    setMessage(null)
    setActionError(null)

    try {
      await deleteBadge.mutateAsync(key)
      setMessage(`Badge « ${label} » supprimé.`)
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : 'Suppression impossible.',
      )
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'badge',
        header: 'Badge',
        cell: (row: BadgeDefinitionRecord) => {
          const Icon = resolveBadgeIcon(row.icon_name)
          return (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex size-8 items-center justify-center rounded-full border border-border bg-muted/40">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="font-display font-bold">{row.label}</p>
                <p className="font-data text-xs text-muted-foreground">{row.key}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'rule',
        header: 'Règle',
        cell: (row: BadgeDefinitionRecord) => (
          <span className="text-muted-foreground">{formatBadgeRule(row)}</span>
        ),
      },
      {
        id: 'meta',
        header: 'Meta',
        cell: (row: BadgeDefinitionRecord) => (
          <div className="flex flex-wrap gap-1">
            <Pill tone="secondary">{row.category}</Pill>
            <Pill tone="secondary">{row.tier}</Pill>
            {row.is_active ? (
              <Pill tone="solid-primary">Actif</Pill>
            ) : (
              <Pill tone="default">Inactif</Pill>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        className: 'w-36',
        cell: (row: BadgeDefinitionRecord) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Aperçu déblocage ${row.label}`}
              onClick={() => previewFromRecord(row)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Modifier ${row.label}`}
              onClick={() => openEditDialog(row)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Supprimer ${row.label}`}
              disabled={deleteBadge.isPending}
              onClick={() => void handleDelete(row.key, row.label)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteBadge.isPending],
  )

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display font-black">Catalogue de badges</CardTitle>
            <CardDescription>
              Créez des médailles avec une règle automatique (streak, séances, PR, volume) ou
              manuelle.
            </CardDescription>
          </div>
          <Button type="button" variant="pill" size="sm" onClick={openCreateDialog}>
            <Plus className="size-4" />
            Nouveau badge
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {message ? <FeedbackMessage variant="success">{message}</FeedbackMessage> : null}
          {actionError && !dialogOpen ? (
            <FeedbackMessage variant="error">{actionError}</FeedbackMessage>
          ) : null}
          {error ? (
            <FeedbackMessage variant="error">
              {error instanceof Error ? error.message : 'Impossible de charger les badges.'}
            </FeedbackMessage>
          ) : null}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des badges...</p>
          ) : (
            <AdminDataTable
              columns={columns}
              rows={badges}
              getRowKey={(row) => row.key}
              emptyMessage="Aucun badge configuré."
            />
          )}
        </CardContent>
      </Card>

      <BadgeDefinitionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        selectedRule={selectedRule}
        actionError={actionError}
        isPending={createBadge.isPending || updateBadge.isPending}
        onSubmit={() => void handleSubmit()}
        onPreview={previewFromForm}
      />

      <BadgeUnlockOverlay
        badges={previewBadges}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}

function BadgeDefinitionDialog({
  open,
  onOpenChange,
  form,
  setForm,
  selectedRule,
  actionError,
  isPending,
  onSubmit,
  onPreview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: BadgeFormState
  setForm: Dispatch<SetStateAction<BadgeFormState>>
  selectedRule: (typeof BADGE_RULE_OPTIONS)[number] | undefined
  actionError: string | null
  isPending: boolean
  onSubmit: () => void
  onPreview: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            {form.isNew ? 'Nouveau badge' : 'Modifier le badge'}
          </DialogTitle>
          <DialogDescription>
            Les badges actifs avec une règle automatique sont évalués à chaque fin de séance et à
            l’ouverture du profil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="badge-key">Clé technique</Label>
            <Input
              id="badge-key"
              value={form.key}
              disabled={!form.isNew}
              placeholder="challenge_mars"
              onChange={(event) =>
                setForm((current) => ({ ...current, key: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-label">Titre affiché</Label>
            <Input
              id="badge-label"
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-description">Description</Label>
            <Textarea
              id="badge-description"
              value={form.description}
              rows={3}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    category: value as BadgeDefinitionInput['category'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={form.tier}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    tier: value as BadgeDefinitionInput['tier'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_TIER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Icône</Label>
              <Select
                value={form.icon_name}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, icon_name: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge-sort">Ordre</Label>
              <Input
                id="badge-sort"
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Règle de déblocage</Label>
            <Select
              value={form.rule_type}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  rule_type: value as BadgeDefinitionInput['rule_type'],
                  rule_threshold:
                    value === 'manual' ? null : current.rule_threshold ?? 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BADGE_RULE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRule ? (
              <p className="text-xs text-muted-foreground">{selectedRule.description}</p>
            ) : null}
          </div>

          {selectedRule?.needsThreshold ? (
            <div className="space-y-2">
              <Label htmlFor="badge-threshold">Seuil</Label>
              <Input
                id="badge-threshold"
                type="number"
                min={1}
                value={form.rule_threshold ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rule_threshold: Number(event.target.value) || null,
                  }))
                }
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Badge actif</p>
              <p className="text-xs text-muted-foreground">
                Les badges inactifs restent visibles ici mais pas dans l’app.
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, is_active: checked }))
              }
            />
          </div>

          {actionError ? <FeedbackMessage variant="error">{actionError}</FeedbackMessage> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onPreview}>
            Aperçu déblocage
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="pill" disabled={isPending} onClick={onSubmit}>
            {isPending ? 'Enregistrement...' : form.isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
