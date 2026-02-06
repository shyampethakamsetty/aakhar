export interface Client {
  id: string
  name: string
  logo?: string // Base64 or URL for logo image
  contact: {
    name: string
    designation: string
    mobile: string
    email: string
    emailCC: string
    billingAddress: string
  }
  createdAt: string
  updatedAt: string
}
