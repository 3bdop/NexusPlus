// using UnityEngine;

// namespace ReadyPlayerMe.Samples.QuickStart
// {
//     public class MouseCursorLock : MonoBehaviour
//     {
//         [SerializeField] [Tooltip("Defines the Cursor Lock Mode to apply")]
//         private CursorLockMode cursorLockMode;
//         [SerializeField] [Tooltip("If true will hide mouse cursor")]
//         private bool hideCursor = true;
//         [SerializeField] [Tooltip("If true it apply cursor settings on start")]
//         private bool applyOnStart = true;

//         // Start is called before the first frame update
//         void Start()
//         {
//             if (applyOnStart)
//             {
//                 Apply();
//             }
//         }

//         public void Apply()
//         {
//             Cursor.visible = hideCursor;
//             Cursor.lockState = cursorLockMode;
//         }
//     }
// }
using UnityEngine;

namespace ReadyPlayerMe.Samples.QuickStart
{
    public class MouseCursorLock : MonoBehaviour
    {
        [SerializeField]
        [Tooltip("Defines the Cursor Lock Mode to apply")]
        private CursorLockMode cursorLockMode;
        [SerializeField]
        [Tooltip("If true will hide mouse cursor")]
        private bool hideCursor = true;
        [SerializeField]
        [Tooltip("If true it applies cursor settings on start")]
        private bool applyOnStart = true;

        void Start()
        {
            if (applyOnStart)
            {
                Apply();
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            // Listen for a user click to activate pointer lock in WebGL
            Application.focusChanged += OnApplicationFocusChanged;
#endif
        }

        public void Apply()
        {
            Cursor.visible = hideCursor;
            Cursor.lockState = cursorLockMode;
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        private void OnApplicationFocusChanged(bool hasFocus)
        {
            if (hasFocus)
            {
                RequestPointerLock();
            }
        }

        private void RequestPointerLock()
        {
            // This only works in WebGL
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        void OnDisable()
        {
            Application.focusChanged -= OnApplicationFocusChanged;
        }
#endif
    }
}
