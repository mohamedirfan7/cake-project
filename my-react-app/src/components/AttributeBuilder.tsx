import React, { useReducer, useState } from 'react'

type Shape = 'Rectangle'|'Round'|'Square'|'Heart'|'Star'|'Oval'
const ALL_SHAPES: Shape[] = ['Rectangle','Round','Square','Heart','Star','Oval']
const ALL_SIZES = ['0.5kg','1kg','1.5kg','2kg','2.5kg','3kg','4kg','5kg']

type ValueType = 'selection'|'text'|'image'
type ChildCategory = { id:string, name:string, values: string[] }

type State = {
  name: string,
  selectionType: 'single'|'multiple'|'radio'|'checkbox',
  status: 'active'|'inactive'|'draft',
  shapes: Shape[],
  sizes: string[],
  values: { id:string, name:string, type: ValueType, description?:string, childCategories?: ChildCategory[] }[],
  prices: Record<string, number>,
  images: Record<string, string>
}

const uid = (p='id')=> p + '_' + Math.random().toString(36).slice(2,9)

const initialState: State = {
  name: 'Custom Cake Attribute',
  selectionType: 'multiple',
  status: 'active',
  shapes: ['Rectangle','Round'],
  sizes: ['1kg','2kg'],
  values: [],
  prices: {},
  images: {}
}

function reducer(state: State, action:any): State {
  switch(action.type){
    case 'set':
      return {...state, ...action.payload}
    case 'addValue':
      return {...state, values: [...state.values, action.payload]}
    case 'updateValue':
      return {...state, values: state.values.map(v=> v.id===action.id? {...v,...action.payload}:v)}
    case 'deleteValue':
      return {...state, values: state.values.filter(v=>v.id!==action.id)}
    case 'toggleShape':
      return {...state, shapes: state.shapes.includes(action.shape) ? state.shapes.filter(s=>s!==action.shape) : [...state.shapes, action.shape]}
    case 'toggleSize':
      return {...state, sizes: state.sizes.includes(action.size) ? state.sizes.filter(s=>s!==action.size) : [...state.sizes, action.size]}
    case 'setPrice':
      return {...state, prices: {...state.prices, [action.key]: action.price}}
    case 'setImage':
      return {...state, images: {...state.images, [action.key]: action.dataUrl}}
    case 'clear':
      return initialState
    default: return state
  }
}

export default function AttributeBuilder(){
  const [state, dispatch] = useReducer(reducer, initialState)
  const [previewOpen, setPreviewOpen] = useState(false)

  function addValue(type: ValueType){
    const v = { id: uid('val'), name: type==='selection' ? 'New Selection' : type==='text' ? 'Text Value' : 'Image Value', type, childCategories: type==='selection'? [{id: uid('cat'), name:'Design', values:['Default']}] : undefined }
    dispatch({type:'addValue', payload: v})
  }

  function addChildValue(valueId:string, catId:string, newVal:string){
    const val = state.values.find(v=>v.id===valueId)
    if(!val || val.type!=='selection') return
    const cats = val.childCategories!.map(c=> c.id===catId ? {...c, values: [...c.values, newVal]} : c)
    dispatch({type:'updateValue', id:valueId, payload:{ childCategories: cats }})
  }

  function generateGridKeys(){
    // Cartesian product of shapes x sizes x child values (if any selection-type values)
    const basePairs = state.shapes.flatMap(s => state.sizes.map(sz => ({shape:s, size:sz})))
    // collect selection value categories values arrays
    const selectionValues = state.values.filter(v=>v.type==='selection')
    if(selectionValues.length===0) {
      return basePairs.map(bp=> `${bp.shape}||${bp.size}`)
    }
    // for each selection value, take all combinations of its categories (cartesian across categories)
    const extraCombos = selectionValues.flatMap(v=>{
      const cats = v.childCategories || []
      // cartesian across categories
      if(cats.length===0) return ['']
      const lists = cats.map(c=> c.values)
      function cart(lists:string[][]){
        if(lists.length===0) return ['']
        return lists.reduce((acc,cur)=>{
          const out:string[] = []
          acc.forEach(a=> cur.forEach(c=> out.push((a? a+'||':'')+c)))
          return out
        }, [''])
      }
      return cart(lists)
    })
    // We need full cross-product: for each basePair and for each combination of selection children across all selection-type values
    const combos:string[] = []
    // For simplicity, take product of all selection-type value category-values flattened across different values
    // Compute all combinations across all selectionValues' category-products
    const selCombPerValue = selectionValues.map(v=>{
      const cats = v.childCategories || []
      if(cats.length===0) return ['']
      // per value, product across its categories
      const lists = cats.map(c=> c.values)
      function cart(lists:string[][]){
        if(lists.length===0) return ['']
        return lists.reduce((acc,cur)=>{
          const out:string[] = []
          acc.forEach(a=> cur.forEach(c=> out.push((a? a+'||':'')+c)))
          return out
        }, [''])
      }
      return cart(lists)
    })
    // now overall product across values
    function cartAll(lists:string[][]){
      if(lists.length===0) return ['']
      return lists.reduce((acc,cur)=>{
        const out:string[]=[]
        acc.forEach(a=> cur.forEach(c=> out.push((a? a+'||':'')+c)))
        return out
      }, [''])
    }
    const allSelComb = cartAll(selCombPerValue)
    basePairs.forEach(bp=>{
      allSelComb.forEach(sel=>{
        combos.push(`${bp.shape}||${bp.size}${sel? '||'+sel : ''}`)
      })
    })
    return combos
  }

  function handleImageUpload(key: string, file: File | null){
    if(!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      dispatch({type:'setImage', key, dataUrl: e.target?.result as string})
    }
    reader.readAsDataURL(file)
  }

  function generateRandom(){
    dispatch({type:'set', payload:{ name: 'Random Attribute '+Math.floor(Math.random()*1000) }})
    // add one selection and one text
    addValue('selection'); addValue('text')
  }

  function saveConfig(){
    console.log('CONFIG:', state)
    alert('Configuration saved to console (see devtools).')
  }

  const gridKeys = generateGridKeys()

  return (
    <div className="space-y-4">
      <section className="bg-white p-4 rounded shadow">
        <div className="flex gap-4 flex-wrap">
          <input className="border p-2 rounded flex-1" value={state.name} onChange={e=>dispatch({type:'set', payload:{name:e.target.value}})} />
          <select className="border p-2 rounded" value={state.selectionType} onChange={e=>dispatch({type:'set', payload:{selectionType: e.target.value}})}>
            <option value="single">single</option>
            <option value="multiple">multiple</option>
            <option value="radio">radio</option>
            <option value="checkbox">checkbox</option>
          </select>
          <select className="border p-2 rounded" value={state.status} onChange={e=>dispatch({type:'set', payload:{status: e.target.value}})}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="draft">draft</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button onClick={generateRandom} className="px-3 py-2 bg-indigo-600 text-white rounded">Generate Random</button>
            <button onClick={()=>setPreviewOpen(true)} className="px-3 py-2 border rounded">Preview</button>
            <button onClick={saveConfig} className="px-3 py-2 bg-green-600 text-white rounded">Save</button>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
  <h2 className="font-semibold mb-2">Shapes</h2>
  <div className="flex gap-2 flex-wrap">
    {/* Shapes */}
{(['Rectangle','Round','Square','Heart','Star','Oval'] as Shape[]).map(s => (
  <button
    key={s}
    onClick={() => dispatch({ type: 'toggleShape', shape: s })}
    className={`px-3 py-1 border rounded ${state.shapes.includes(s) ? 'selected' : ''}`}
  >
    {s}
  </button>
))}
  </div>

  <h2 className="font-semibold mt-4 mb-2">Sizes</h2>
  <div className="flex gap-2 flex-wrap">
    {/* Sizes */}
{(['0.5kg','1kg','1.5kg','2kg','2.5kg','3kg','4kg','5kg']).map(sz => (
  <button
    key={sz}
    onClick={() => dispatch({ type: 'toggleSize', size: sz })}
    className={`px-3 py-1 border rounded ${state.sizes.includes(sz) ? 'selected' : ''}`}
  >
    {sz}
  </button>
))}
  </div>
</section>


      <section className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Values</h2>
          <div className="flex gap-2">
            <button onClick={()=>addValue('selection')} className="px-3 py-1 border rounded">Add Selection</button>
            <button onClick={()=>addValue('text')} className="px-3 py-1 border rounded">Add Text</button>
            <button onClick={()=>addValue('image')} className="px-3 py-1 border rounded">Add Image</button>
          </div>
        </div>

        <div className="space-y-3">
          {state.values.map(v=> (
            <div key={v.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <input className="font-medium" value={v.name} onChange={e=>dispatch({type:'updateValue', id:v.id, payload:{name:e.target.value}})} />
                  <div className="text-xs text-gray-500">{v.type}</div>
                </div>
                <div className="flex gap-2">
                  <select value={v.type} onChange={e=>dispatch({type:'updateValue', id:v.id, payload:{type: e.target.value}})} className="border p-1 rounded">
                    <option value="selection">selection</option>
                    <option value="text">text</option>
                    <option value="image">image</option>
                  </select>
                  <button onClick={()=>dispatch({type:'deleteValue', id:v.id})} className="px-2 py-1 border rounded">Delete</button>
                </div>
              </div>

              {v.type==='selection' && (
                <div className="mt-2">
                  <div className="flex gap-2 flex-wrap">
                    {(v.childCategories || []).map(cat=> (
                      <div key={cat.id} className="p-2 border rounded">
                        <input className="font-medium" value={cat.name} onChange={e=>{
                          const cats = (v.childCategories||[]).map(c=> c.id===cat.id? {...c, name: e.target.value}: c)
                          dispatch({type:'updateValue', id:v.id, payload:{childCategories: cats}})
                        }} />
                        <div className="flex gap-1 flex-wrap mt-2">
                          {cat.values.map((cv,i)=> <span key={i} className="px-2 py-0.5 text-sm border rounded">{cv}</span>)}
                        </div>
                        <div className="mt-2">
                          <input placeholder="new value" id={`input_${v.id}_${cat.id}`} className="border p-1 text-sm" />
                          <button onClick={()=>{
                            const el = document.getElementById(`input_${v.id}_${cat.id}`) as HTMLInputElement|null
                            if(!el || !el.value) return
                            addChildValue(v.id, cat.id, el.value)
                            el.value = ''
                          }} className="ml-2 px-2 py-1 border rounded text-sm">Add</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={()=>{
                      const cats = [...(v.childCategories||[]), { id: 'cat_'+Math.random().toString(36).slice(2,6), name: 'New Cat', values: ['Default'] }]
                      dispatch({type:'updateValue', id:v.id, payload:{childCategories: cats}})
                    }} className="px-3 py-1 border rounded">Add Category</button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Price & Image Configuration</h2>
        <div className="text-sm text-gray-600 mb-2">Combinations: {gridKeys.length}</div>
        <div className="space-y-2">
          {gridKeys.slice(0,200).map(key=>{
            const price = state.prices[key] ?? 0
            const img = state.images[key]
            const isComplex = key.split('||').length > 2
            return (
              <div key={key} className={`p-2 border rounded flex items-center gap-3 ${isComplex? 'complex-combination':''}`}>
                <div className="flex-1 text-sm">{key}</div>
                <input type="number" value={price} onChange={e=>dispatch({type:'setPrice', key, price: Number(e.target.value)})} className="w-28 border p-1 rounded" />
                <div>
                  <input id={'file_'+key} type="file" accept="image/*" onChange={e=> handleImageUpload(key, e.target.files?.[0] ?? null)} />
                  {img && <img src={img} alt="preview" className="h-12 w-12 object-cover mt-1 rounded has-image" />}
                </div>
              </div>
            )
          })}
          {gridKeys.length>200 && <div className="text-xs text-gray-500">Showing first 200 combinations...</div>}
        </div>
      </section>

      {previewOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded max-w-2xl w-full">
            <h3 className="font-semibold">Preview</h3>
            <pre className="text-xs max-h-80 overflow-auto">{JSON.stringify(state, null, 2)}</pre>
            <div className="mt-2 flex justify-end">
              <button onClick={()=>setPreviewOpen(false)} className="px-3 py-1 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
