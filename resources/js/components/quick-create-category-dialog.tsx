import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface QuickCreateCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId: number | null;
    parentName?: string;
    onSuccess?: () => void;
}

export function QuickCreateCategoryDialog({
    open,
    onOpenChange,
    parentId,
    parentName,
    onSuccess,
}: QuickCreateCategoryDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        code: string;
        parent_id: number | null;
        color: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        parent_id: null,
        color: '#3b82f6',
        is_active: true,
    });

    // Update parent_id when parentId prop changes
    useEffect(() => {
        setData('parent_id', parentId);
    }, [parentId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/risk-categories', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                // Call the success callback to refresh categories BEFORE closing dialog
                if (onSuccess) {
                    onSuccess();
                }
                onOpenChange(false);
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Quick Create Category</DialogTitle>
                        <DialogDescription>
                            {parentName
                                ? `Create a subcategory under "${parentName}"`
                                : 'Create a new root category'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quick-name">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Financial Risk"
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-code">
                                Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="quick-code"
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value.toUpperCase())
                                }
                                placeholder="e.g., FIN"
                                maxLength={50}
                            />
                            {errors.code && (
                                <p className="text-sm text-destructive">{errors.code}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-color">Color</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="quick-color"
                                    type="color"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    className="h-10 w-20 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    placeholder="#3b82f6"
                                    maxLength={7}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
