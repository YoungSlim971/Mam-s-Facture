const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function buildFacturePDF(facture, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    // Titre et logo
    doc.fillColor('#0099b0').fontSize(24).text('Facture', 50, 40);
    if (facture.logo_path) {
      try {
        const logoPath = path.isAbsolute(facture.logo_path)
          ? facture.logo_path
          : path.join(__dirname, '..', facture.logo_path);
        doc.image(logoPath, doc.page.width - 140, 30, { width: 90 });
      } catch (e) {
        // ignore logo errors
      }
    }

    let y = 90;
    doc.fillColor('black').fontSize(12);

    // Bloc vendeur
    doc.text(facture.nom_entreprise || '', 50, y);
    if (facture.adresse) {
      doc.text(facture.adresse, 50, (y += 15));
    }
    if (facture.siren) {
      doc.text(`SIREN : ${facture.siren}`, 50, (y += 15));
    }
    if (facture.vat_number) {
      doc.text(`TVA : ${facture.vat_number}`, 50, (y += 15));
    }

    // Bloc client
    y = 90;
    const rightX = 320;
    doc.text('Client :', rightX, y);
    doc.text(facture.nom_client || '', rightX, (y += 15));
    if (facture.nom_entreprise_client) {
      doc.text(facture.nom_entreprise_client, rightX, (y += 15));
    }
    if (facture.adresse_client) {
      doc.text(facture.adresse_client, rightX, (y += 15));
    }

    // Tableau des lignes
    y = Math.max(doc.y + 20, y + 20);
    const tableTop = y;

    const columnPositions = [50, 250, 300, 360, 420, 480];
    doc.rect(50, tableTop, 500, 20).fill('#f0f0f0');
    doc.fillColor('black').fontSize(9);
    const headers = ['Description', 'Qté', 'Unité', 'PU HT', '% TVA', 'TTC'];
    headers.forEach((h, i) => {
      doc.text(h, columnPositions[i], tableTop + 5);
    });
    y = tableTop + 25;

    let totalHT = 0;
    let totalTVA = 0;
    const tauxTVA = parseFloat(facture.vat_rate || 0);

    (facture.lignes || []).forEach(ligne => {
      const qte = parseFloat(ligne.quantite) || 0;
      const pu = parseFloat(ligne.prix_unitaire) || 0;
      const tva = tauxTVA || parseFloat(ligne.tva || 0);
      const ht = qte * pu;
      const tvaMontant = ht * (tva / 100);
      const ttc = ht + tvaMontant;

      doc.text(ligne.description || '', columnPositions[0], y, { width: 180 });
      doc.text(qte.toString(), columnPositions[1], y);
      doc.text(ligne.unite || '', columnPositions[2], y);
      doc.text(pu.toFixed(2), columnPositions[3], y);
      doc.text(tva ? tva.toString() : '0', columnPositions[4], y);
      doc.text(ttc.toFixed(2), columnPositions[5], y);

      y += 20;
      totalHT += ht;
      totalTVA += tvaMontant;
    });

    const totalTTC = totalHT + totalTVA;
    const prixHTFromTTC = totalTTC / 1.2;

    y += 10;
    doc.moveTo(350, y).lineTo(550, y).stroke();
    y += 5;
    doc.text(`Total HT : ${totalHT.toFixed(2)} €`, 350, (y += 15));
    doc.text(`TVA (${tauxTVA}% ) : ${totalTVA.toFixed(2)} €`, 350, (y += 15));
    doc.text(`Prix HT : ${prixHTFromTTC.toFixed(2)} €`, 350, (y += 15));
    doc.text(`Total TTC : ${totalTTC.toFixed(2)} €`, 350, (y += 15));

    // Conditions de paiement
    y += 30;
    doc.fontSize(9).text('Conditions de paiement : règlement à réception.', 50, y);

    // Barre de bas de page
    doc.rect(0, doc.page.height - 50, doc.page.width, 10).fill('#0099b0');

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = buildFacturePDF;
