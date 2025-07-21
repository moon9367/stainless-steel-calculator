// 표면 종류별 샘플 이미지 매핑
const surfaceImages = {
  '2B': 'sample_2b.jpg',
  'HL': 'sample_hl.jpg',
  'Mirror': 'sample_mirror.jpg',
  'BLK_HL': 'sample_blackhl.jpg',
  'GOL_HL': 'sample_goldhl.jpg',
  'GOL_Mirror': 'sample_goldmirror.jpg',
};

const typeSelect = document.getElementById('type');
const sampleImage = document.getElementById('sampleImage');
const sampleImageBox = document.querySelector('.sample-image-box');
const thicknessSelect = document.getElementById('thickness');
const quantityInput = document.getElementById('quantity');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const submitBtn = document.querySelector('.submit-btn');
const resultCard = document.getElementById('resultCard');
const estimatePriceSpan = document.getElementById('estimatePrice');
const pay1000Span = document.getElementById('pay1000');
const pay100Span = document.getElementById('pay100');

// 견적 리스트 누적 영역 (HTML에서 이미 정의됨)
const estimateListBox = document.getElementById('estimateListBox');

// 표면별 사용 가능한 두께 정의
const surfaceThickness = {
  'HL': ['0.8T', '1.0T', '1.2T', '1.5T', '2.0T'],
  '2B': ['0.8T', '1.0T', '1.2T', '1.5T', '2.0T'],
  'Mirror': ['1.0T', '1.2T', '1.5T', '2.0T'],
  'BLK_HL': ['1.2T'],
  'GOL_HL': ['1.2T'],
  'GOL_Mirror': ['1.2T']
};

// 두께 옵션 업데이트 함수
function updateThicknessOptions(surfaceType) {
  const thicknessSelect = document.getElementById('thickness');
  const currentThickness = thicknessSelect.value;
  const availableThickness = surfaceThickness[surfaceType] || [];
  
  // 기존 옵션 제거
  thicknessSelect.innerHTML = '<option value="">두께 선택</option>';
  
  // 새로운 옵션 추가
  availableThickness.forEach(thickness => {
    const option = document.createElement('option');
    option.value = thickness;
    option.textContent = thickness;
    thicknessSelect.appendChild(option);
  });
  
  // 기존 선택값이 새로운 옵션에 있으면 유지
  if (currentThickness && availableThickness.includes(currentThickness)) {
    thicknessSelect.value = currentThickness;
  }
}

// 표면과 두께 조합 유효성 검사
function validateSurfaceThickness(surface, thickness) {
  const availableThickness = surfaceThickness[surface] || [];
  return availableThickness.includes(thickness);
}

// 진입 시 샘플 이미지 박스와 이미지 모두 숨김
sampleImageBox.classList.add('hide');
sampleImage.classList.add('hide');

// 표면종류 선택 이벤트 리스너
typeSelect.addEventListener('change', function() {
  const selectedType = this.value;
  
  if (selectedType && selectedType !== 'a') {
    // 샘플 이미지 업데이트
    if (surfaceImages[selectedType]) {
      sampleImage.src = surfaceImages[selectedType];
      sampleImageBox.classList.remove('hide');
      sampleImage.classList.remove('hide');
    }
    
    // 두께 옵션 업데이트 (기존 선택 유지)
    updateThicknessOptions(selectedType);
  } else {
    // 샘플 이미지 숨김
    sampleImageBox.classList.add('hide');
    sampleImage.classList.add('hide');
    
    // 두께 옵션 초기화
    thicknessSelect.innerHTML = '<option value="">두께 선택</option>';
  }
});

// 팝업 관련 함수들
function showPopup() {
  const popup = document.getElementById('popup');
  popup.classList.remove('hide');
}

function closePopup() {
  const popup = document.getElementById('popup');
  popup.classList.add('hide');
}

// 최소 재단 체크 함수
function checkMinimumCutting(width, height) {
  return width < 50 || height < 50;
}

// 경동택배 착불 발송 체크 함수
function checkLargeSize(width, height) {
  // 1. 한 면이 900mm 이상인 경우
  // 2. 가로와 세로 모두 650mm를 초과하는 경우 (700*700, 800*800 등)
  return width >= 900 || height >= 900 || (width > 650 && height > 650);
}

// 경동택배 안내 표시/숨김 함수
function updateShippingNotice() {
  const shippingNotice = document.getElementById('shippingNotice');
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  
  // 견적 리스트에서 경동택배 조건에 해당하는 항목이 있는지 체크
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  
  if (hasLargeSize && totalQuantity > 0) {
    shippingNotice.classList.remove('hide');
  } else {
    shippingNotice.classList.add('hide');
  }
}

// 실제 견적 금액 산출 공식 (예시: H/L 1.2T, 300x500, 1개 = 20,800원)
function calculateEstimate() {
  const width = parseInt(widthInput.value, 10);
  const height = parseInt(heightInput.value, 10);
  const thickness = parseFloat(thicknessSelect.value);
  const quantity = parseInt(quantityInput.value, 10);
  const type = typeSelect.value;

  if (isNaN(width) || isNaN(height) || isNaN(thickness) || isNaN(quantity)) {
    return null;
  }

  // 단가 테이블 (예시)
  const unitPriceTable = {
    '2B': { '0.8': 223, '1': 271, '1.2': 317, '1.5': 388, '2': 506 },
    'HL': { '0.8': 244, '1': 295, '1.2': 346, '1.5': 420, '2': 548 },
    'Mirror': { '1': 330, '1.2': 385, '1.5': 460, '2': 598 },
    'BLK_HL': { '1.2': 500 },
    'GOL_HL': { '1.2': 627 },
    'GOL_Mirror': { '1.2': 627 },
  };

  // 면적 계산 (50mm 단위 올림)
  const calcWidth = Math.ceil(width / 50) * 50;
  const calcHeight = Math.ceil(height / 50) * 50;
  const area = (calcWidth * calcHeight) / 2500; // 2500 = 50x50

  // 단가
  let unitPrice = 0;
  if (unitPriceTable[type] && unitPriceTable[type][thickness]) {
    unitPrice = unitPriceTable[type][thickness];
  } else {
    return null;
  }

  // 판재비 (100원 단위 올림, 최소 1,000원)
  let plateCost = Math.ceil((unitPrice * area) / 100) * 100;
  if (plateCost < 1000) plateCost = 1000;

  // 재단비 (판재비 10,000원 미만이면 1,000원, 이상이면 0원)
  let cutCost = plateCost < 10000 ? 1000 : 0;

  // 총 금액
  let total = (plateCost + cutCost) * quantity;
  return {
    total,
    plateCost,
    cutCost,
    quantity,
    type,
    thickness,
    width,
    height,
    sampleImg: surfaceImages[type] || 'sample_default.jpg',
  };
}

// 결제 안내 계산 함수
function getPaymentGuide(price) {
  const pay1000 = Math.floor(price / 1000);
  const remainder = price % 1000;
  const pay100 = Math.floor(remainder / 100);
  return { pay1000, pay100 };
}

// 누적 견적 데이터 저장
let estimateList = [];

// 계산 & 추가하기 버튼 클릭 이벤트
submitBtn.addEventListener('click', function() {
  const type = typeSelect.value;
  const thickness = thicknessSelect.value;
  const quantity = parseInt(quantityInput.value);
  const width = parseInt(widthInput.value);
  const height = parseInt(heightInput.value);

  if (!type || type === 'a' || !thickness || isNaN(quantity) || isNaN(width) || isNaN(height)) {
    alert('모든 값을 입력해주세요.');
    return;
  }

  // 표면과 두께 조합 유효성 검사
  if (!validateSurfaceThickness(type, thickness)) {
    alert('선택하신 표면에서는 해당 두께를 사용할 수 없습니다.\n올바른 두께를 선택해주세요.');
    return;
  }

  // 최소 재단 체크
  if (checkMinimumCutting(width, height)) {
    showPopup();
    return;
  }

  const estimate = calculateEstimate();
  if (estimate === null) {
    alert('입력값을 확인해 주세요.');
    return;
  }

  // 견적 추가
  estimateList.push(estimate);

  // 총합 계산
  const totalSum = estimateList.reduce((acc, cur) => acc + cur.total, 0);
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  const { pay1000, pay100 } = getPaymentGuide(totalSum);

  // 경동택배 안내 업데이트
  updateShippingNotice();

  // 상단 결과 카드 업데이트 (총 견적 금액)
  estimatePriceSpan.textContent = totalSum.toLocaleString();
  pay1000Span.textContent = pay1000;
  pay100Span.textContent = pay100;
  
  // 면모서리가공 수량 업데이트
  const edgeQuantitySpan = document.getElementById('edgeQuantity');
  if (edgeQuantitySpan) {
    edgeQuantitySpan.textContent = totalQuantity;
  }
  
  resultCard.classList.remove('hide');

  // 결제 안내문은 더 이상 사용하지 않음 (새로운 UI로 대체)

  // 견적 리스트에 카드 추가 (샘플 이미지 없이, 정보만)
  const card = document.createElement('div');
  card.className = 'estimate-list-card';
  card.style.background = '#fff';
  card.style.borderRadius = '12px';
  card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
  card.style.padding = '18px 16px';
  card.style.marginBottom = '18px';
  card.style.display = 'flex';
  card.style.alignItems = 'center';
  card.style.gap = '18px';
  card.style.minWidth = '320px';
  card.style.maxWidth = '420px';

  // 정보
  const info = document.createElement('div');
  info.style.flex = '1';
  info.style.textAlign = 'left';
  info.innerHTML = `
    <div style="font-size:1rem;font-weight:600;">${estimate.width} × ${estimate.height} / ${estimate.quantity}개 / ${estimate.type} ${estimate.thickness}T</div>
    <div style="font-size:0.95rem;color:#4f8cff;margin:4px 0 0 0;">${estimate.total.toLocaleString()}원</div>
  `;
  card.appendChild(info);

  // X(삭제) 버튼
  const delBtn = document.createElement('button');
  delBtn.textContent = '✕';
  delBtn.style.background = 'none';
  delBtn.style.border = 'none';
  delBtn.style.fontSize = '1.3rem';
  delBtn.style.color = '#888';
  delBtn.style.cursor = 'pointer';
  delBtn.style.marginLeft = '8px';
  
  // 클로저를 사용하여 현재 estimate의 인덱스를 정확히 기억
  const currentIndex = estimateList.length - 1;
  delBtn.onclick = function() {
    // DOM에서 카드 제거
    estimateListBox.removeChild(card);
    
    // 배열에서 해당 항목 제거 (카드의 데이터 속성으로 찾기)
    const cardIndex = estimateList.findIndex(item => 
      item.width === estimate.width && 
      item.height === estimate.height && 
      item.type === estimate.type && 
      item.thickness === estimate.thickness && 
      item.quantity === estimate.quantity &&
      item.total === estimate.total
    );
    
    if (cardIndex > -1) {
      estimateList.splice(cardIndex, 1);
    }
    
    // 총 금액 재계산
    const newTotal = estimateList.reduce((acc, cur) => acc + cur.total, 0);
    const { pay1000, pay100 } = getPaymentGuide(newTotal);
    const newQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
    
    // 경동택배 안내 업데이트
    updateShippingNotice();
    
    // 상단 결과 카드 업데이트
    estimatePriceSpan.textContent = newTotal.toLocaleString();
    pay1000Span.textContent = pay1000;
    pay100Span.textContent = pay100;
    
    // 면모서리가공 수량 업데이트
    const edgeQuantitySpan = document.getElementById('edgeQuantity');
    if (edgeQuantitySpan) {
      edgeQuantitySpan.textContent = newQuantity;
    }
    
    if (newTotal === 0) {
      // 모든 항목이 삭제된 경우 결과 카드 숨기기
      resultCard.classList.add('hide');
      return;
    }
    
    // 결제 안내문은 더 이상 사용하지 않음 (새로운 UI로 대체)
  };
  card.appendChild(delBtn);

  // 리스트에 추가
  estimateListBox.appendChild(card);
});

// 최초 진입 시 결과 카드 숨김
resultCard.classList.add('hide');
