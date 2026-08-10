import { useState, useEffect } from 'react'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../context/AuthContext'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  UserIcon,
  HomeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export default function Payment() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [transactions, setTransactions] = useState([])

  // Determine if user can pay (only SUB_TENANT and MAIN_TENANT)
  const canPay = user?.role === 'SUB_TENANT' || user?.role === 'MAIN_TENANT'

  useEffect(() => {
    fetchInvoices()
    fetchTransactions()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/leasing/invoices/')
      // For non-pay roles, show all invoices (including paid ones)
      // For pay roles, only show pending invoices
      let data = res.data
      if (canPay) {
        data = data.filter(inv => inv.status !== 'paid')
      }
      setInvoices(data)
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/payments/transactions/')
      setTransactions(res.data.slice(0, 5))
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    }
  }

  const toggleInvoice = (inv) => {
    // Allow anyone to expand the invoice
    if (selectedInvoice?.id === inv.id) {
      setSelectedInvoice(null)
      setPaymentStatus(null)
    } else {
      setSelectedInvoice(inv)
      setPaymentStatus(null)
      setPhoneNumber('')
    }
  }

  const handlePayment = async () => {
    if (!selectedInvoice) return
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number')
      return
    }

    setIsProcessing(true)
    setPaymentStatus(null)

    try {
      const res = await api.post('/payments/transactions/initiate_payment/', {
        invoice_id: selectedInvoice.id,
        phone_number: phoneNumber
      })

      setPaymentStatus({
        type: 'pending',
        message: 'STK Push sent to your phone. Please enter your PIN to confirm payment.'
      })

      pollTransactionStatus(res.data.transaction.id)
      
    } catch (err) {
      setPaymentStatus({
        type: 'error',
        message: err.response?.data?.error || 'Payment failed. Please try again.'
      })
      setIsProcessing(false)
    }
  }

  const pollTransactionStatus = async (transactionId) => {
    let attempts = 0
    const maxAttempts = 30

    const checkStatus = async () => {
      try {
        const url = '/payments/transactions/' + transactionId + '/check_status/'
        const res = await api.get(url)
        const status = res.data.status

        if (status === 'success') {
          setPaymentStatus({
            type: 'success',
            message: '✅ Payment successful! Your invoice has been marked as paid.'
          })
          setIsProcessing(false)
          fetchInvoices()
          fetchTransactions()
          setSelectedInvoice(null)
          return
        } else if (status === 'failed' || status === 'cancelled') {
          setPaymentStatus({
            type: 'error',
            message: res.data.result_description || 'Payment failed. Please try again.'
          })
          setIsProcessing(false)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 3000)
        } else {
          setPaymentStatus({
            type: 'warning',
            message: 'Payment is still processing. Please check your M-PESA messages or try again later.'
          })
          setIsProcessing(false)
        }
      } catch (err) {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 3000)
        }
      }
    }

    checkStatus()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'failed': return <XCircleIcon className="w-5 h-5 text-red-600" />
      case 'pending': return <ClockIcon className="w-5 h-5 text-yellow-600" />
      default: return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusClass = (status) => {
    if (status === 'paid') return 'bg-green-200 text-green-800'
    if (status === 'overdue') return 'bg-red-200 text-red-800'
    return 'bg-yellow-200 text-yellow-800'
  }

  const getPaymentStatusClass = (type) => {
    if (type === 'success') return 'bg-green-50 border border-green-200'
    if (type === 'error') return 'bg-red-50 border border-red-200'
    if (type === 'warning') return 'bg-yellow-50 border border-yellow-200'
    return 'bg-blue-50 border border-blue-200'
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <CreditCardIcon className="w-7 h-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-800">
          {canPay ? 'Make Payment' : 'View Invoices'}
        </h1>
        {!canPay && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">View‑only</span>}
      </div>

      <GlassCard>
        <h2 className="font-semibold text-gray-700 mb-2">
          {canPay ? 'Select Invoice to Pay' : 'All Invoices'}
        </h2>
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-sm">No invoices found.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => {
              const isExpanded = selectedInvoice?.id === inv.id
              const lease = inv.lease || {}
              const room = lease.room || {}
              const house = room.house || {}
              const estate = house.estate || {}
              return (
                <div
                  key={inv.id}
                  className={"rounded-lg overflow-hidden transition-all " + (
                    isExpanded ? 'bg-blue-50/30 border-2 border-blue-300' : 'bg-white/30 hover:bg-white/50'
                  )}
                >
                  {/* Clickable header - always clickable to expand */}
                  <div
                    onClick={() => toggleInvoice(inv)}
                    className="p-3 flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">KES {inv.total_amount}</p>
                      <p className="text-sm text-gray-600">Due: {inv.due_date}</p>
                      {!canPay && !isExpanded && (
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                          <span className="flex items-center gap-1"><HomeIcon className="w-3 h-3" /> {house.house_number || 'N/A'}</span>
                          <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {lease.sub_tenant?.username || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={"px-2 py-1 rounded-full text-xs font-medium " + (
                        inv.status === 'overdue' ? 'bg-red-200 text-red-800' : 
                        inv.status === 'paid' ? 'bg-green-200 text-green-800' :
                        'bg-yellow-200 text-yellow-800'
                      )}>
                        {inv.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content - always shown when expanded */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/20 space-y-3">
                      {/* Read-only details (shown for everyone) */}
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Estate:</span> {estate.name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">House:</span> {house.house_number || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Room:</span> {room.room_name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Tenant:</span> {lease.sub_tenant?.username || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Period:</span> {inv.period_start} – {inv.period_end}
                        </div>
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Balance:</span> KES {inv.balance_due}
                        </div>
                      </div>

                      {/* Payment form - only for paying users */}
                      {canPay && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="0712345678"
                              className="mt-1 block w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                              disabled={isProcessing}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter your M-PESA registered number</p>
                          </div>

                          {paymentStatus && (
                            <div className={"p-3 rounded-lg " + getPaymentStatusClass(paymentStatus.type)}>
                              <div className="flex items-start gap-3">
                                {getStatusIcon(paymentStatus.type)}
                                <p className="text-sm">{paymentStatus.message}</p>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={handlePayment}
                            disabled={isProcessing || !selectedInvoice}
                            className={"w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 " + (
                              isProcessing || !selectedInvoice
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                            )}
                          >
                            {isProcessing ? (
                              <>
                                <ClockIcon className="w-5 h-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCardIcon className="w-5 h-5" />
                                Pay with M-PESA
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>

      <div>
        <h2 className="font-semibold text-gray-700 mb-2">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <GlassCard>
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </GlassCard>
        ) : (
          transactions.map(tx => (
            <GlassCard key={tx.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">KES {tx.amount}</p>
                  <p className="text-sm text-gray-600">{tx.phone_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(tx.status)}
                  <span className={"px-2 py-1 rounded-full text-xs font-medium " + getStatusClass(tx.status)}>
                    {tx.status}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
