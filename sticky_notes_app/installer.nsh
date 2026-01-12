; 설치 전 기존 앱 프로세스 강제 종료
!macro customInit
  ; 실행 중인 스티키 노트 프로세스 종료
  nsExec::ExecToStack 'taskkill /F /IM "스티키 노트.exe"'
  nsExec::ExecToStack 'taskkill /F /IM "sticky-notes.exe"'
!macroend

; 업데이트 전에도 종료
!macro customInstallMode
  nsExec::ExecToStack 'taskkill /F /IM "스티키 노트.exe"'
  nsExec::ExecToStack 'taskkill /F /IM "sticky-notes.exe"'
!macroend
