import { Button } from '@/components/ui/button';
import { TreeView, type TreeNode } from '@/components/ui/tree-view';
import { router } from '@inertiajs/react';
import {
    Eye,
    Folder,
    FolderPlus,
    FolderTree,
    Pencil,
    Trash2,
} from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

interface RiskCategory {
    id: number;
    name: string;
    code: string;
    description: string | null;
    color: string | null;
    parent_id: number | null;
    is_active: boolean;
    risks_count: number;
    parent?: {
        id: number;
        name: string;
    } | null;
    children?: RiskCategory[];
    descendants?: RiskCategory[];
}

interface RiskCategoriesTreeProps {
    categories: RiskCategory[];
    onQuickCreate?: (parentId: number | null, parentName?: string) => void;
    onDelete?: (category: RiskCategory) => void;
    showActions?: boolean;
    searchable?: boolean;
    selectedId?: number;
}

const RiskCategoriesTree = ({
    categories,
    onQuickCreate,
    onDelete,
    showActions = true,
}: RiskCategoriesTreeProps) => {
    const [searchQuery] = React.useState('');
    // Convert categories to tree nodes
    const convertToTreeNodes = useCallback(
        (categories: RiskCategory[]): TreeNode[] => {
            return categories.map((category) => {
                const hasChildren =
                    (category.children?.length ?? 0) > 0 ||
                    (category.descendants?.length ?? 0) > 0;

                const node: TreeNode = {
                    id: category.id.toString(),
                    label: `${category.name} (${category.code})${!category.is_active ? ' [Inactive]' : ''}${category.risks_count > 0 ? ` [${category.risks_count}]` : ''}`,
                    type: hasChildren ? 'folder' : 'file',
                    data: category,
                    icon: hasChildren ? (
                        <FolderTree className="h-4 w-4 text-primary/70" />
                    ) : (
                        <Folder className="h-4 w-4 text-muted-foreground" />
                    ),
                    children: hasChildren
                        ? convertToTreeNodes(
                              category.children || category.descendants || [],
                          )
                        : undefined,
                    actions: showActions && (
                        <div className="flex items-center gap-0.5">
                            {onQuickCreate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-accent hover:text-foreground"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onQuickCreate(
                                            category.id,
                                            category.name,
                                        );
                                    }}
                                    title="Add subcategory"
                                >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-accent hover:text-foreground"
                                asChild
                            >
                                <a
                                    href={`/risk-categories/${category.id}`}
                                    title="View"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-accent hover:text-foreground"
                                asChild
                            >
                                <a
                                    href={`/risk-categories/${category.id}/edit`}
                                    title="Edit"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onDelete(category);
                                    }}
                                    title="Delete"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    ),
                    onClick: () => {
                        router.visit(`/risk-categories/${category.id}`);
                    },
                };

                return node;
            });
        },
        [onQuickCreate, onDelete, showActions],
    );

    // Convert nested categories to tree structure with multiple levels
    const buildTree = (categories: RiskCategory[]): RiskCategory[] => {
        // Create a map of all categories by ID for quick lookup
        const categoryMap = new Map<number, RiskCategory>();
        const roots: RiskCategory[] = [];

        // First pass: create a map of all categories
        const processCategory = (category: RiskCategory): RiskCategory => {
            // Create a new category object with children array
            const processedCategory: RiskCategory = {
                ...category,
                children: [],
            };

            // If this category has descendants, process them recursively
            if (category.descendants && category.descendants.length > 0) {
                processedCategory.children =
                    category.descendants.map(processCategory);
            }

            // Add to map
            categoryMap.set(category.id, processedCategory);
            return processedCategory;
        };

        // Process all top-level categories
        categories.forEach(processCategory);

        // Second pass: build the tree structure
        categoryMap.forEach((category) => {
            // If it's a root category (no parent or parent not in the map), add to roots
            if (!category.parent_id || !categoryMap.has(category.parent_id)) {
                roots.push(category);
            }
        });

        return roots;
    };

    // Convert categories to tree data items
    const convertToTreeData = React.useCallback(
        (categories: RiskCategory[]): TreeNode[] => {
            return categories.map((cat) => {
                // Store category reference for actions
                const categoryData = cat;
                return {
                    id: cat.id.toString(),
                    label: `${cat.name} (${cat.code})${!cat.is_active ? ' [Inactive]' : ''}${cat.risks_count > 0 ? ` [${cat.risks_count}]` : ''}`,
                    icon:
                        cat.children && cat.children.length > 0 ? (
                            <FolderTree className="h-4 w-4 text-primary/70" />
                        ) : (
                            <Folder className="h-4 w-4 text-muted-foreground" />
                        ),
                    children: cat.children
                        ? convertToTreeData(cat.children)
                        : undefined,
                    actions: showActions ? (
                        <div className="flex gap-0.5">
                            {onQuickCreate && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickCreate(
                                            categoryData.id,
                                            categoryData.name,
                                        );
                                    }}
                                    title="Add subcategory"
                                >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                asChild
                            >
                                <a href={`/risk-categories/${categoryData.id}`}>
                                    <Eye className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                asChild
                            >
                                <a
                                    href={`/risk-categories/${categoryData.id}/edit`}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(categoryData);
                                    }}
                                    title="Delete"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    ) : undefined,
                };
            });
        },
        [onQuickCreate, onDelete, showActions],
    );

    // Filter categories based on search while maintaining hierarchy
    const filterCategories = useMemo(() => {
        if (!searchQuery) return categories;

        const query = searchQuery.toLowerCase();

        // Function to check if a category or any of its descendants match the search
        const hasMatchingDescendant = (category: RiskCategory): boolean => {
            // Check if current category matches
            const name = (category.name ?? '').toLowerCase();
            const code = (category.code ?? '').toLowerCase();
            const description = (category.description ?? '').toLowerCase();
            if (
                name.includes(query) ||
                code.includes(query) ||
                description.includes(query)
            ) {
                return true;
            }

            // Check if any descendant matches
            if (category.descendants) {
                return category.descendants.some(hasMatchingDescendant);
            }

            return false;
        };

        // Function to filter categories and their descendants
        const filterTree = (items: RiskCategory[]): RiskCategory[] => {
            return items.filter(hasMatchingDescendant).map((item) => ({
                ...item,
                descendants: item.descendants
                    ? filterTree(item.descendants)
                    : [],
            }));
        };

        return filterTree(categories);
    }, [categories, searchQuery]);

    const treeData = useMemo(
        () => convertToTreeData(buildTree(filterCategories)),
        [filterCategories, convertToTreeData],
    );

    return (
        <div className="space-y-4">
            {treeData.length > 0 ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {searchQuery ? 'Found' : 'Showing'}{' '}
                            {filterCategories.length} of {categories.length}{' '}
                            categories
                        </span>
                    </div>
                    <div className="overflow-y-auto rounded-md">
                        <TreeView data={treeData} />
                    </div>
                </div>
            ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-muted-foreground">
                    <FolderTree className="h-16 w-16 opacity-20" />
                    <div className="text-center">
                        <p className="font-medium">
                            {searchQuery
                                ? 'No categories found'
                                : 'No categories yet'}
                        </p>
                        <p className="text-sm">
                            {searchQuery
                                ? 'Try adjusting your search'
                                : 'Create your first category to get started'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export { RiskCategoriesTree };
export type { RiskCategory };
