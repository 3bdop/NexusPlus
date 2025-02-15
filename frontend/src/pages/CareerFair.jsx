import React from 'react'
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const FullScreenContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
export default function CareerFair() {
    const navigate = useNavigate();
    return (
        <>
            <FullScreenContainer>

                <iframe
                    src="http://localhost:5050/webgl"
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    title="Career Fair"
                />
                {/* <button style={{ zIndex: 1 }} onClick={() => navigate('/home')}>disconnect</button> */}
            </FullScreenContainer>
        </>
    )
}
