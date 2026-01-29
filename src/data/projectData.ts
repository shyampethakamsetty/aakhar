import projectsJson from './projects.json'
import type { Project, RawProjectData } from '../types/project'

const rawData = projectsJson as { rows: RawProjectData[] }

function parseNumber(val: string | number | null): number {
    if (typeof val === 'number') return val
    if (!val) return 0
    const clean = val.replace(/,/g, '').replace(/[^\d.-]/g, '')
    return parseFloat(clean) || 0
}

function parseString(val: string | number | null): string {
    if (!val) return ''
    return String(val).trim()
}

export const mapToProject = (raw: RawProjectData): Project => {
    return {
        jan: typeof raw['Job Allocation No. (JAN)'] === 'number' ? raw['Job Allocation No. (JAN)'] : 0,
        clientName: parseString(raw['Client Name']),
        location: {
            state: parseString(raw['State']),
            city: parseString(raw['Place / City']),
        },
        workName: parseString(raw['Name of Work']),
        status: parseString(raw['Current Status']),
        financialYear: parseString(raw['Financial Year']),
        dates: {
            tinderDate: parseString(raw['Tender Ref. No. / NIT & Date']), // Note: This field often mixes Ref No and Date
            loaDate: parseString(raw['PO/WO/LOA Date']),
            startDate: parseString(raw['Work Start Date']),
            completionDateOriginal: parseString(raw['Completion Date as per LOA/PO']),
            completionDateLatest: parseString(raw['Latest Work Completion Date (as per Time Extension)']),
        },
        contract: {
            valueInternal: parseNumber(raw['Contract Value Version as per LOI/NOA/LOA/DLOA/PO GST Extra']),
            valueUpdated: parseNumber(raw['Updated Contract Value GST Extra']),
            gstTerms: parseString(raw['GST Extra /Including']),
        },
        clientContact: {
            name: parseString(raw['Name of Authorised Person At Client']),
            designation: parseString(raw['Designation of Authorised Person At Client']),
            mobile: parseString(raw['Mobile No. of Authorised Person At Client']),
            email: parseString(raw['Email of Authorised Person At Client']),
            billingAddress: parseString(raw['Client Billing Address']),
            emailCC: parseString(raw['Email CC (Client)/C&M']),
        },
        bankGuarantee: {
            status: parseString(raw['Bank Guarantee Submitted / CPG Not Submitted']),
            value: parseNumber(raw['Bank Guarantee Value']),
            expiryDate: parseString(raw['Bank Guaratee Expiry Date']),
            claimDate: parseString(raw['Bank Guaratee Expiry Date (Claim)']),
        },
        compliance: {
            emdStatus: parseString(raw['EMD/tender fee Online /Exempted as per MSME bidder']),
            emdPaymentStatus: parseString(raw['EMD /online payment received status']),
            hrClearance: parseString(raw['HR required data for HR clearance RA bill realeased']),
            policyExpiry: parseString(raw['Policy Expired dt./renewal if any']),
            laborLicense: parseString(raw['Labour License No./date of reg. & expired dt. /BOCW if any']),
            pfEsicStatus: parseString(raw['Status of PF/ESIC pending amount for HR clearance Running bills']),
        },
        extra: {
            eicName: parseString(raw['EIC at Aakar']),
            poDetails: parseString(raw['PO/WO/LOA Details']),
            completionDateFinal: parseString(raw['Completion Date as per Finla Time Extension / Deviation']),
        },
        subcontractor: {
            name: parseString(raw['1st Sub Contractor\'s Name']),
            proprietor: parseString(raw['Proprietor / Auth. Signatory of Sub-Cont.']),
            mobile: parseString(raw['Mobile No. of Sub-Cont. Proprietor / Auth. Signatory\'s']),
            email: parseString(raw['Email of Sub-Cont. Proprietor / Auth. Signatory\'s']),
            gstin: parseString(raw['GSTIN of Sub Contractor']),
            workOrderNo: parseString(raw['Work Order No.']),
            workOrderDate: parseString(raw['Work Order Date']),
            workOrderPercent: parseString(raw['WO on % Party']),
        },
        documents: {
            loaLink: parseString(raw['Client WO/PO Upload LINK']),
            agreementLink: parseString(raw['Client contract agreement LINK']),
            subWorkOrderLink: parseString(raw['Sub-Contractor Work Order (Upload)']),
        },
    }
}

export const projectService = {
    getAllProjects: (): Project[] => {
        return rawData.rows.map(mapToProject)
    },

    getProjectByJan: (jan: number): Project | undefined => {
        return projectService.getAllProjects().find((p) => p.jan === jan)
    },

    // Stats helpers
    getTotalContractValue: (): number => {
        return projectService.getAllProjects().reduce((acc, curr) => acc + curr.contract.valueInternal, 0)
    },

    getProjectsByStatus: () => {
        const projects = projectService.getAllProjects()
        // Groupping logic could go here
        return projects
    }
}
