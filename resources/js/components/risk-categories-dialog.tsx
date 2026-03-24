import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderPlus, FolderTree } from 'lucide-react';
import { RiskCategoriesTree, RiskCategory } from '@/components/risk-categories-tree';

interface RiskCategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoriesLoading: boolean;
    riskCategories: RiskCategory[];
    handleQuickCreate: (parentId: number | null, parentName?: string) => void;
    handleDeleteCategory: (category: RiskCategory) => void;
    handleNewCategory: () => void;
}

export function RiskCategoriesDialog({
    open,
    onOpenChange,
    categoriesLoading,
    riskCategories,
    handleQuickCreate,
    handleDeleteCategory,
    handleNewCategory,
}: RiskCategoriesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderTree className="h-5 w-5" />
                        Risk Categories Management
                    </DialogTitle>
                    <DialogDescription>
                        Manage your risk categories hierarchy. Create, edit, or delete categories.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {categoriesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">Loading categories...</div>
                        </div>
                    ) : (
                        <RiskCategoriesTree
                            categories={riskCategories}
                            onQuickCreate={handleQuickCreate}
                            onDelete={handleDeleteCategory}
                            showActions={true}
                            searchable={true}
                        />
                    )}
                </div>
                <DialogFooter className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handleNewCategory}
                    >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Category
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/risk-categories'}
                        >
                            Full View
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
