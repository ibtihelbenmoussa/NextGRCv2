export interface BPMNDiagram {
    id: number;
    diagramable_type: string;
    diagramable_id: number;
    name: string;
    bpmn_xml: string;
    description?: string;
    uploaded_by?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    uploader?: User;
}
import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    auth: Auth;
    currentOrganization: Organization | null;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    organization_id: number;
    permissions_count?: number;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    department?: string;
    job_title?: string;
    current_organization_id?: number | null;
    created_at: string;
    updated_at: string;
    organizations?: Organization[];
    current_organization?: Organization;
    default_organization?: Organization;
    organization_roles?: Role[]; // Roles in a specific organization context
    roles?: Role[]; // General roles relationship
    pivot?: {
        organization_id: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

// GRC Domain Types
export interface Organization {
    id: number;
    name: string;
    code: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Counts
    users_count?: number;
    business_units_count?: number;
    risks_count?: number;
    controls_count?: number;
    audit_missions_count?: number;
    // Relationships
    business_units?: BusinessUnit[];
    users?: User[];
    risks?: Risk[];
    controls?: Control[];
    // Pivot data when accessed through user relationship
    pivot?: {
        organization_id: number;
        user_id: number;
        role: string;
        is_default: boolean;
        [key: string]: unknown;
    };
}

export interface BusinessUnit {
    id: number;
    organization_id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    organization?: Organization;
    managers?: User[];
    macro_processes_count?: number;
    macro_processes?: MacroProcess[];
    documents?: Document[];
}

export interface MacroProcess {
    id: number;
    business_unit_id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    business_unit?: BusinessUnit;
    managers?: User[];
    processes_count?: number;
    processes?: Process[];
    documents?: Document[];
    bpmn_diagrams?: BPMNDiagram[];
}

export interface Process {
    id: number;
    macro_process_id: number;
    name: string;
    code: string;
    description?: string;
    objectives?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    macro_process?: MacroProcess;
    managers?: User[];
    risks?: Risk[];
    risks_count?: number;
    documents?: Document[];
    bpmn_diagrams?: BPMNDiagram[];
}

export interface Category {
    id: number
    name: string
    parent_id: number | null
}

export interface AppSetting {
    id: number
    key: string
    value: string
}
export interface Risk {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    description?: string;
    category?: string;
    inherent_likelihood?: number;
    inherent_impact?: number;
    residual_likelihood?: number;
    residual_impact?: number;
    owner_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    organization?: Organization;
    owner?: User;
    processes?: Process[];
    controls?: Control[];
    inherent_score?: number;
    residual_score?: number;
    processes_count?: number;
    controls_count?: number;
}

export interface Control {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    description?: string;
    control_type?: 'preventive' | 'detective' | 'corrective';
    control_nature?: 'manual' | 'automated' | 'it-dependent';
    frequency?: string;
    owner_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    organization?: Organization;
    owner?: User;
    risks?: Risk[];
    risks_count?: number;
    tests_count?: number;
}


export interface PredefindTest {
    id: number;
    organization_id: number;
    code: string;
    name: string;
    test_objective: string;
    test_result: string;
    risk: string;
    echantillon: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    organization?: Organization;
}

export interface Planning {
    id: number;
    organization_id: number;
    name: string;
    code: string;
    description?: string;
    year: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    organization?: Organization;
    audit_missions_count?: number;
}

export type AuditMissionStatus = 'planned' | 'in_progress' | 'closed';

export interface AuditMission {
    id: number;
    planning_id: number;
    name: string;
    code: string;
    description?: string;
    objectives?: string;
    scope?: string;
    start_date: string;
    end_date?: string;
    status: AuditMissionStatus;
    audit_chief_id: number;
    created_at: string;
    updated_at: string;
    planning?: Planning;
    audit_chief?: User;
    auditors?: User[];
    requested_documents_count?: number;
    interviews_count?: number;
    tests_count?: number;
    reports_count?: number;
}

export interface Document {
    id: number;
    documentable_type: string;
    documentable_id: number;
    name: string;
    file_path: string;
    file_name: string;
    disk: string;
    mime_type: string;
    file_size: number;
    category?: string;
    description?: string;
    uploaded_by?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    url?: string;
}

export interface RequestedDocument {
    id: number;
    audit_mission_id: number;
    name: string;
    description?: string;
    status: 'requested' | 'received' | 'not_available';
    requested_date: string;
    received_date?: string;
    requested_from_user_id?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    audit_mission?: AuditMission;
    requested_from?: User;
}

export interface Interview {
    id: number;
    audit_mission_id: number;
    interviewee_id: number;
    title: string;
    purpose?: string;
    scheduled_at?: string;
    conducted_at?: string;
    location?: string;
    notes?: string;
    status: 'scheduled' | 'conducted' | 'cancelled';
    created_at: string;
    updated_at: string;
    audit_mission?: AuditMission;
    interviewee?: User;
}

export type TestReviewStatus = 'pending' | 'accepted' | 'rejected';
export type TestResult =
    | 'effective'
    | 'partially_effective'
    | 'ineffective'
    | 'not_applicable';

export interface Test {
    id: number;
    audit_mission_id: number;
    control_id: number;
    risk_id?: number;
    name: string;
    objective?: string;
    test_procedure?: string;
    sample_description?: string;
    sample_size?: number;
    test_result?: TestResult;
    findings?: string;
    recommendations?: string;
    review_status: TestReviewStatus;
    review_comments?: string;
    reviewed_by?: number;
    reviewed_at?: string;
    performed_by?: number;
    test_date?: string;
    created_at: string;
    updated_at: string;
    audit_mission?: AuditMission;
    control?: Control;
    risk?: Risk;
    reviewer?: User;
    performer?: User;
}

export interface ManagementComment {
    id: number;
    audit_mission_id: number;
    test_id?: number;
    finding?: string;
    management_response?: string;
    action_plan?: string;
    responsible_user_id?: number;
    target_date?: string;
    status: 'pending' | 'agreed' | 'disagreed' | 'implemented';
    submitted_by?: number;
    submitted_at?: string;
    created_at: string;
    updated_at: string;
    audit_mission?: AuditMission;
    test?: Test;
    responsible_user?: User;
    submitter?: User;
}

export interface Report {
    id: number;
    audit_mission_id: number;
    title: string;
    report_type: 'draft' | 'preliminary' | 'final';
    executive_summary?: string;
    introduction?: string;
    scope_and_methodology?: string;
    findings?: string;
    recommendations?: string;
    conclusion?: string;
    status: 'draft' | 'under_review' | 'approved' | 'issued';
    prepared_by?: number;
    reviewed_by?: number;
    approved_by?: number;
    issue_date?: string;
    file_path?: string;
    created_at: string;
    updated_at: string;
    audit_mission?: AuditMission;
    preparer?: User;
    reviewer?: User;
    approver?: User;
}

// Paginated response type
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
