'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, X, Plus, Loader2, ChevronDown, Check } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getVendorEmoji } from '@/lib/vendor-icons';

type VendorStatus =
  | 'researching'
  | 'contacted'
  | 'quoted'
  | 'meeting_scheduled'
  | 'negotiating'
  | 'booked'
  | 'declined'
  | 'archived';

type VendorSource = 'manual' | 'the_knot' | 'wedding_wire' | 'referral' | 'other';

interface VendorCategory {
  id: string;
  name: string;
  icon: string | null;
  default_budget_percentage: number | null;
  sort_order: number;
}

interface Vendor {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  source: VendorSource | null;
  source_url: string | null;
  status: VendorStatus;
  rating: number | null;
  notes: string | null;
  quoted_price: number | null;
  final_price: number | null;
  deposit_amount: number | null;
  deposit_due_date: string | null;
  deposit_paid: boolean;
  is_booked: boolean;
  booked_date: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  vendor_categories?: { id: string; name: string; icon: string | null };
}

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  company_name: z.string().optional(),
  category_id: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  source: z.enum(['manual', 'the_knot', 'wedding_wire', 'referral', 'other']).optional(),
  quoted_price: z.string().optional(),
  notes: z.string().optional(),
});

/** Normalize a website URL — auto-prepend https:// if missing */
function normalizeWebsite(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null
  const trimmed = val.trim()
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

type VendorFormValues = z.input<typeof vendorFormSchema>;

function StarRatingInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hovered ?? value ?? 0) >= starValue;
        return (
          <button
            key={i}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(value === starValue ? null : starValue)}
            aria-label={`Rate ${starValue} stars`}
          >
            <Star
              className={`size-5 ${
                isFilled
                  ? 'fill-[#C9A96E] text-[#C9A96E]'
                  : 'fill-transparent text-[#D1D5DB]'
              }`}
            />
          </button>
        );
      })}
      {value !== null && value !== undefined && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-[#7A7A7A] hover:text-[#2D2D2D]"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string; icon?: string | null }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={selectedOption ? 'text-[#2D2D2D]' : 'text-[#7A7A7A]'}>
          {selectedOption
            ? <>
                {selectedOption.icon && <span className="mr-1.5">{selectedOption.icon}</span>}
                {selectedOption.label}
              </>
            : placeholder}
        </span>
        <ChevronDown className={`size-4 text-[#7A7A7A] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white py-1 shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D2D2D] hover:bg-[#FAF8F5]"
            >
              {option.icon && <span>{option.icon}</span>}
              <span className="flex-1 text-left">{option.label}</span>
              {value === option.value && <Check className="size-4 text-[#8B9F82]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 bg-[#8B9F82]/10 text-[#8B9F82]">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-[#DC2626]"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder="Type a tag and press Enter"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addTag(input)}
          disabled={!input.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface VendorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSuccess?: () => void;
}

export function VendorForm({ open, onOpenChange, vendor, onSuccess }: VendorFormProps) {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [rating, setRating] = useState<number | null>(vendor?.rating ?? null);
  const [tags, setTags] = useState<string[]>(vendor?.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(vendor?.category_id ?? '');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>(vendor?.source ?? '');

  const isEditing = !!vendor;
  const supabase = useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: vendor?.name ?? '',
      company_name: vendor?.company_name ?? '',
      category_id: vendor?.category_id ?? '',
      email: vendor?.email ?? '',
      phone: vendor?.phone ?? '',
      website: vendor?.website ?? '',
      instagram: vendor?.instagram ?? '',
      source: vendor?.source ?? undefined,
      quoted_price: vendor?.quoted_price?.toString() ?? '',
      notes: vendor?.notes ?? '',
    },
  });

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('vendor_categories')
      .select('*')
      .order('sort_order');
    if (data) setCategories(data as VendorCategory[]);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name ?? '',
        company_name: vendor.company_name ?? '',
        category_id: vendor.category_id ?? '',
        email: vendor.email ?? '',
        phone: vendor.phone ?? '',
        website: vendor.website ?? '',
        instagram: vendor.instagram ?? '',
        source: vendor.source ?? undefined,
        quoted_price: vendor.quoted_price?.toString() ?? '',
        notes: vendor.notes ?? '',
      });
      setRating(vendor.rating ?? null);
      setTags(vendor.tags ?? []);
      setSelectedCategory(vendor.category_id ?? '');
      setSelectedSource(vendor.source ?? '');
    } else {
      reset({
        name: '',
        company_name: '',
        category_id: '',
        email: '',
        phone: '',
        website: '',
        instagram: '',
        source: undefined,
        quoted_price: undefined,
        notes: '',
      });
      setRating(null);
      setTags([]);
      setSelectedCategory('');
      setCustomCategoryName('');
      setSelectedSource('');
    }
  }, [vendor, reset]);

  const otherCategory = categories.find((c) => c.name === 'Other');
  const isOtherSelected = selectedCategory === otherCategory?.id;

  async function onSubmit(values: VendorFormValues) {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save a vendor');
        setSaving(false);
        return;
      }

      // If "Other" is selected with a custom name, create or reuse that category
      let categoryId = selectedCategory || null;
      if (isOtherSelected && customCategoryName.trim()) {
        const trimmedName = customCategoryName.trim();
        // Check if a category with this name already exists
        const { data: existing } = await supabase
          .from('vendor_categories')
          .select('id')
          .ilike('name', trimmedName)
          .single();

        if (existing) {
          categoryId = existing.id;
        } else {
          const { data: created, error: catErr } = await supabase
            .from('vendor_categories')
            .insert({ name: trimmedName, icon: 'plus', default_budget_percentage: 0, sort_order: 99 })
            .select('id')
            .single();
          if (catErr) {
            toast.error('Failed to create custom category');
            setSaving(false);
            return;
          }
          categoryId = created.id;
        }
      }

      const vendorData = {
        name: values.name,
        company_name: values.company_name || null,
        category_id: categoryId,
        email: values.email || null,
        phone: values.phone || null,
        website: normalizeWebsite(values.website),
        instagram: values.instagram || null,
        source: (selectedSource as VendorSource) || null,
        quoted_price: values.quoted_price ? parseFloat(values.quoted_price) : null,
        notes: values.notes || null,
        rating,
        tags: tags.length > 0 ? tags : null,
        user_id: user.id,
      };

      if (isEditing && vendor) {
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendor.id);

        if (error) throw error;
        toast.success('Vendor updated successfully');
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert(vendorData);

        if (error) throw error;
        toast.success('Vendor added successfully');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error saving vendor:', err);
      toast.error('Failed to save vendor. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#2D2D2D]">
            {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the vendor details below.'
              : 'Fill in the details to add a new vendor to your list.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="vendor-name">
              Vendor Name <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="vendor-name"
              placeholder="Jane Smith Photography"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-[#DC2626]">{errors.name.message}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="vendor-company">Company Name</Label>
            <Input
              id="vendor-company"
              placeholder="Smith Studios LLC"
              {...register('company_name')}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                if (val !== otherCategory?.id) setCustomCategoryName('');
              }}
              placeholder="Select a category"
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
                icon: getVendorEmoji(cat.icon),
              }))}
            />
            {isOtherSelected && (
              <Input
                placeholder="Enter custom category name"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-email">Email</Label>
              <Input
                id="vendor-email"
                type="email"
                placeholder="jane@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-[#DC2626]">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input
                id="vendor-phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
              />
            </div>
          </div>

          {/* Website & Instagram */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-website">Website</Label>
              <Input
                id="vendor-website"
                type="text"
                placeholder="https://example.com"
                {...register('website')}
                aria-invalid={!!errors.website}
              />
              {errors.website && (
                <p className="text-xs text-[#DC2626]">{errors.website.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-instagram">Instagram</Label>
              <Input
                id="vendor-instagram"
                placeholder="@janesmithphoto"
                {...register('instagram')}
              />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label>Source</Label>
            <CustomSelect
              value={selectedSource}
              onChange={setSelectedSource}
              placeholder="How did you find them?"
              options={[
                { value: 'manual', label: 'Manual Entry' },
                { value: 'the_knot', label: 'The Knot' },
                { value: 'wedding_wire', label: 'WeddingWire' },
                { value: 'referral', label: 'Referral' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          {/* Quoted Price */}
          <div className="space-y-1.5">
            <Label htmlFor="vendor-price">Quoted Price</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#7A7A7A]">$</span>
              <Input
                id="vendor-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                {...register('quoted_price')}
              />
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="vendor-notes">Notes</Label>
            <Textarea
              id="vendor-notes"
              placeholder="Add any notes about this vendor..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Vendor'
              ) : (
                'Add Vendor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
