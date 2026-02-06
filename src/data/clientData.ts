import type { Client } from '../types/client'

const STORAGE_KEY = 'aakhar_clients'

// Get clients from localStorage
const getStoredClients = (): Client[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading clients from storage:', error)
  }
  return []
}

// Save clients to localStorage
const saveClients = (clients: Client[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  } catch (error) {
    console.error('Error saving clients to storage:', error)
  }
}

export const clientService = {
  getAllClients: (): Client[] => {
    return getStoredClients()
  },

  getClientById: (id: string): Client | undefined => {
    const clients = getStoredClients()
    return clients.find(c => c.id === id)
  },

  getClientByName: (name: string): Client | undefined => {
    const clients = getStoredClients()
    return clients.find(c => c.name.toLowerCase() === name.toLowerCase())
  },

  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client => {
    const clients = getStoredClients()
    const newClient: Client = {
      ...client,
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    clients.push(newClient)
    saveClients(clients)
    return newClient
  },

  updateClient: (id: string, updates: Partial<Client>): Client | null => {
    const clients = getStoredClients()
    const index = clients.findIndex(c => c.id === id)
    if (index === -1) return null

    clients[index] = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveClients(clients)
    return clients[index]
  },

  deleteClient: (id: string): boolean => {
    const clients = getStoredClients()
    const filtered = clients.filter(c => c.id !== id)
    if (filtered.length === clients.length) return false
    saveClients(filtered)
    return true
  },

  searchClients: (query: string): Client[] => {
    const clients = getStoredClients()
    if (!query.trim()) return clients
    const q = query.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.contact.name.toLowerCase().includes(q) ||
      c.contact.email.toLowerCase().includes(q) ||
      c.contact.billingAddress.toLowerCase().includes(q)
    )
  },
}
