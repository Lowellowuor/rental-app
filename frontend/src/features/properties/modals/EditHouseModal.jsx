import { useEffect, useState } from 'react'
import api from '@/api/client'
import {
  Footer,
  FormError,
  Modal,
  TextField,
} from './AddHouseModal'

export default function EditHouseModal({ isOpen, onClose, house, onSuccess }) {
  const [values, setValues] = useState({ house_number: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && house) {
      setValues({ house_number: house.house_number || '' })
      setErrors({})
      setFormError('')
      setSubmitting(false)
    }
  }, [isOpen, house])

  if (!isOpen || !house) return null

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (formError) setFormError('')
  }

  function validate(v) {
    const e = {}
    if (!v.house_number.trim()) e.house_number = 'House number is required.'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')

    try {
      await api.patch(`/properties/houses/${house.id}/`, {
        house_number: values.house_number.trim(),
      })
      if (onSuccess) onSuccess()
    } catch (err) {
      const payload = err?.response?.data
      if (payload && typeof payload === 'object') {
        const fields = {}
        for (const [k, v] of Object.entries(payload)) {
          fields[k] = Array.isArray(v) ? v[0] : String(v)
        }
        setErrors(fields)
        if (payload.detail) setFormError(String(payload.detail))
      } else {
        setFormError('Could not update house. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Edit house" subtitle={house.estate_name} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5">
        <FormError message={formError} />

        <TextField
          id="edit-house-number"
          label="House number"
          value={values.house_number}
          onChange={(v) => set('house_number', v)}
          error={errors.house_number}
          autoFocus
        />

        <Footer onClose={onClose} submitting={submitting} submitLabel="Save changes" />
      </form>
    </Modal>
  )
}