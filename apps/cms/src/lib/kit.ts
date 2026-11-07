// Kit kuralları paylaşılan pakette (site önizlemesi de aynı listeyi kullanır).
export * from '@updated/kit'

/** Puan verilmeyen ürün türleri (7 Kasım 2026, kullanıcı: "şimdilik lens ve kamerada olmayacak"). Aynı liste sitede apps/web/src/lib/ui.ts PUANSIZ_TUR. */
export const PUANSIZ_TUR = ['camera', 'lens']
