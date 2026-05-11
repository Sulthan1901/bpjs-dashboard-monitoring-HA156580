import { useState, useCallback } from 'react'
import { perusahaanService } from '/services/perusahaan'
import toast from 'react-hot-toast'

export function usePerusahaan({ userId, isAdmin, isSupervisor, supervisorId }) {
  const [data, setData] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sippFilter, setSippFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const limit = 20

  const fetch = useCallback(async (overrides = {}) => {
    setLoading(true)
    try {
      const result = await perusahaanService.getAll({
        page: overrides.page ?? page,
        limit,
        search: overrides.search ?? search,
        status: overrides.status ?? statusFilter,
        sipp: overrides.sipp ?? sippFilter,
        adminId: overrides.adminId ?? adminFilter,
        userId,
        isAdmin,
        isSupervisor,
        supervisorId,
      })
      setData(result.data)
      setCount(result.count)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, sippFilter, adminFilter, userId, isAdmin, isSupervisor, supervisorId])

  const create = async (payload, actorInfo) => {
    const result = await perusahaanService.create(payload, actorInfo)
    toast.success('Perusahaan berhasil ditambahkan')
    await fetch()
    return result
  }

  const update = async (id, payload, actorInfo) => {
    const result = await perusahaanService.update(id, payload, actorInfo)
    toast.success('Data berhasil diupdate')
    setData(prev => prev.map(r => r.id === id ? { ...r, ...result } : r))
    return result
  }

  const remove = async (id, actorInfo) => {
    await perusahaanService.softDelete(id, actorInfo)
    toast.success('Data berhasil dihapus')
    setData(prev => prev.filter(r => r.id !== id))
    setCount(prev => prev - 1)
  }

  const handleSearch = (val) => {
    setSearch(val); setPage(1)
    fetch({ search: val, page: 1 })
  }

  const handleStatusFilter = (val) => {
    setStatusFilter(val); setPage(1)
    fetch({ status: val, page: 1 })
  }

  const handleSippFilter = (val) => {
    setSippFilter(val); setPage(1)
    fetch({ sipp: val, page: 1 })
  }

  const handleAdminFilter = (val) => {
    setAdminFilter(val); setPage(1)
    fetch({ adminId: val, page: 1 })
  }

  const handlePageChange = (p) => {
    setPage(p)
    fetch({ page: p })
  }

  const resetFilters = () => {
    setSearch(''); setStatusFilter(''); setSippFilter(''); setAdminFilter(''); setPage(1)
    fetch({ search: '', status: '', sipp: '', adminId: '', page: 1 })
  }

  const hasActiveFilters = !!(search || statusFilter || sippFilter || adminFilter)

  return {
    data, count, loading, page, limit,
    search, statusFilter, sippFilter, adminFilter,
    fetch, create, update, remove,
    handleSearch, handleStatusFilter, handleSippFilter, handleAdminFilter,
    handlePageChange, resetFilters, hasActiveFilters,
  }
}