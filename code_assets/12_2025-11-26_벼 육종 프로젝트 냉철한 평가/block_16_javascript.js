<div class="validation-options">
  <h4>검증 방법 선택</h4>
  <label>
    <input type="radio" name="validation" value="simple" checked>
    빠른 검증 (Train-Test Split 80-20)
  </label>
  <label>
    <input type="radio" name="validation" value="cv">
    교차검증 (5-Fold Stratified CV)
  </label>
  <label>
    <input type="radio" name="validation" value="strict">
    엄격한 검증 (Leave-One-Group-Out)
  </label>
  
  <button onclick="runValidation()">검증 실행</button>
</div>

<div id="validationResults">
  <!-- 형질별 F1 score, 표준편차, Learning Curve 표시 -->
</div>
